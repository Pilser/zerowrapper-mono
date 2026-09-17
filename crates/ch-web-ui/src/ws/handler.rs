use std::collections::HashMap;
use std::sync::Arc;
use std::sync::LazyLock;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use topcoat::router::content::websocket::{Message, WebSocket};
use zw_core::StreamEvent;
use zw_mcp::inspect_cmd;

// B: frontend base URL per session (from whiteboard_sync) so the agent can
// construct tenant-aware public URLs https://host/tenant/?wb=slug and
// correct /api/srv base, mirroring how check.js reports location.href.
const SHARED_ID_FALLBACK: &str = "shared";
static FRONTEND_BASES: LazyLock<tokio::sync::Mutex<HashMap<String, String>>> =
    LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));
pub async fn frontend_base_for(session_id: &str) -> Option<String> {
    let m = FRONTEND_BASES.lock().await;
    if let Some(v) = m.get(session_id) { return Some(v.clone()); }
    // manage_whiteboard uses `shared` id — also try that
    if let Some(v) = m.get(SHARED_ID_FALLBACK) { return Some(v.clone()); }
    None
}
async fn set_frontend_base(session_id: &str, base: String) {
    if base.is_empty() { return }
    let mut m = FRONTEND_BASES.lock().await;
    m.insert(session_id.to_string(), base.clone());
    m.insert(SHARED_ID_FALLBACK.to_string(), base);
}

// Ephemeral replay buffer: hybrid memory + DB. Memory for fast reconnect
// within the same process, DB for cross-restart resumption. This is NOT
// session message storage — agent DB remains the source of truth for
// history. Buffer drains 10 min after turn_complete, 60 min for orphaned.
static MEM_BUFFER: LazyLock<tokio::sync::Mutex<HashMap<String, Vec<serde_json::Value>>>> =
    LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

// Native engines, one per chat session. The lock is only held to take or
// return an engine — never across a turn — so sessions never block each other.
// There is no daemon path anymore: every prompt runs here, in-process.
/// Native engines, one per chat session, each behind its own mutex: turns
/// on the same session serialize (a second prompt waits for the running
/// turn instead of forking a second engine), while sessions never block
/// each other. Engines stay in the map for life — history and the picker
/// always see them, running or not.
static ENGINES: LazyLock<
    tokio::sync::Mutex<
        HashMap<String, std::sync::Arc<tokio::sync::Mutex<zw_agent_embed::engine::Engine>>>,
    >,
> = LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

// In-flight native turns: task handle + true-cancel slot per session.
// Cancel aborts the RUNNER (model stream + tool children die for real),
// never our task: the turn closes gracefully, the engine survives with its
// context, and only a pre-drain cancel falls back to aborting the task
// (engine dropped, rebuilt next message). Refresh/reconnect never cancels:
// the turn keeps running and the stream resumes from the buffer.
static TASKS: LazyLock<
    tokio::sync::Mutex<
        HashMap<
            String,
            (
                tokio::task::JoinHandle<()>,
                zw_agent_embed::engine::AbortSlot,
            ),
        >,
    >,
> = LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

/// Live native sessions for the picker: id, display name, model/provider,
/// message count, token totals, cost — plus `running` while a turn is in
/// flight (drives the send→cancel button window). Straight from the engines.
/// Sorted newest-first by engine `updated_at`.
pub async fn agent_session_list() -> Vec<serde_json::Value> {
    let engines = ENGINES.lock().await;
    let tasks = TASKS.lock().await;
    let mut out: Vec<serde_json::Value> = engines
        .iter()
        .map(|(sid, e)| {
            let running = tasks.contains_key(sid);
            match e.try_lock() {
                Ok(guard) => {
                    let s = guard.session();
                    serde_json::json!({
                        "id": sid,
                        "name": s.name.to_string(),
                        "model": s.model.to_string(),
                        "provider": s.provider.to_string(),
                        "messages": s.messages.len(),
                        "input_tokens": s.total_input_tokens,
                        "output_tokens": s.total_output_tokens,
                        "cost": s.total_cost,
                        "updated_at": s.updated_at.to_string(),
                        "running": running,
                    })
                }
                // Mid-turn: details locked, but presence + running flag still
                // answer the picker and the cancel-button window.
                Err(_) => serde_json::json!({
                    "id": sid,
                    "running": true,
                }),
            }
        })
        .collect();
    // `updated_at` is RFC3339: lexicographic order == chronological.
    // (`serde_json::Value` has no `Ord`; compare as strings.)
    out.sort_by(|a, b| {
        b.get("updated_at")
            .and_then(|v| v.as_str())
            .cmp(&a.get("updated_at").and_then(|v| v.as_str()))
    });
    out
}

/// Unified transcript (B): DB cache is source of truth, agent file is fallback.
///
/// On first run DB is empty, we backfill from live engine/file. Once a turn
/// commits via `run_embedded_turn`, its `chat_messages` rows become the
/// durable history. While a turn is `processing`, callers still get the last
/// committed snapshot — live deltas arrive via `stream_buffer` replay + WS, not
/// via this call. This makes refresh/busy never return a stale file that
/// hides the message right after the questions.
pub async fn engine_history(session_id: &str) -> Vec<zw_agent_embed::HistoryMsg> {
    // 1) Try wrapper DB cache (written on every committed turn; survives
    // busy `try_lock` and restarts). If any rows exist, they are the truth.
    // We read via a short-lived pool clone without holding ENGINES lock.
    // (The pool handle is looked up from the global? Instead we peek via
    // session file as fallback — actual DB read happens in `history_snapshot`
    // where the pool is available. Here we keep a best-effort fast path.)
    {
        let engines = ENGINES.lock().await;
        if let Some(e) = engines.get(session_id) {
            if let Ok(guard) = e.try_lock() {
                let live = zw_agent_embed::session_history(&guard);
                // If DB cache already has rows, prefer to check elsewhere,
                // but when called without DB handle we return live (pre-cache).
                if !live.is_empty() {
                    // Caller with DB will override; for bare callers return live.
                } else {
                    return live;
                }
                // For now return live — `history_snapshot` with DB will replace
                // with DB rows when present. Keeping this path prevents breaking
                // background callers that lack a pool.
                return live;
            }
            // Mid-turn: engine is busy; fall through to its last save.
        }
    }
    zw_agent_embed::load_session_history(session_id).unwrap_or_default()
}

/// DB-backed history: committed rows from `chat_messages` plus session state.
/// Used by HTTP history endpoint so refresh while `processing` never hides
/// the committed transcript behind a locked engine.
pub async fn db_history(db: &zw_db::DbPool, session_id: &str) -> Vec<zw_agent_embed::HistoryMsg> {
    if let Ok(rows) = db.get_chat_messages(session_id, 500).await {
        if !rows.is_empty() {
            return rows
                .into_iter()
                .map(|r| zw_agent_embed::HistoryMsg { role: r.role, content: r.content, turn_id: r.turn_id })
                .collect();
        }
    }
    // Fallback to agent-owned file / live engine.
    engine_history(session_id).await
}

/// Snapshot for the HTTP history API: committed history + smart status so the
/// frontend knows whether to expect live deltas via resume/HTTP poll.
pub async fn history_snapshot(
    db: &zw_db::DbPool,
    session_id: &str,
) -> serde_json::Value {
    let messages = db_history(db, session_id).await;
    let (status, active_turn) = db.get_session_status(session_id).await.unwrap_or(("idle".into(), "".into()));
    let tasks = TASKS.lock().await;
    let running_mem = tasks.contains_key(session_id);
    let status_eff = if running_mem { "processing".to_string() } else { status };
    let max_seq = db.stream_buffer_max_seq(session_id).await.unwrap_or(0);
    let pending = db.ask_pending_for_session(session_id).await.unwrap_or_default();
    let pending_json: Vec<serde_json::Value> = pending.iter().map(|r| {
        serde_json::json!({"id": r.id, "session_id": r.session_id, "questions": serde_json::from_str::<serde_json::Value>(&r.questions).unwrap_or(serde_json::json!([]))})
    }).collect();
    serde_json::json!({
        "session_id": session_id,
        "messages": messages,
        "total": messages.len(),
        "start": 0,
        "status": status_eff,
        "active_turn": active_turn,
        "running": status_eff == "processing",
        "max_seq": max_seq,
        "pending_asks": pending_json,
    })
}

/// Drive one prompt through the native engine, emitting typed `StreamEvent`s
/// (buffer/resume unchanged).
async fn run_embedded_turn(
    session_id: String,
    prompt: String,
    event_tx: mpsc::Sender<StreamEvent>,
    db: zw_db::DbPool,
    turn_id: String,
    raw: String,
    abort_slot: zw_agent_embed::engine::AbortSlot,
) {
    let _ = db.touch_session(&session_id).await;
    // B: mark processing BEFORE the engine mutex waits — even if this task
    // is queued behind a running turn, the DB already tells history callers
    // and refresh/resume that the session is busy so they use the live buffer.
    let _ = db.set_session_processing(&session_id, &turn_id).await;
    // Persist user turn eagerly: refresh while the engine is busy still sees
    // the prompt (engine file + live buffer both still miss it). Idempotent
    // per turn key so a queued duplicate doesn't double-insert.
    {
        let exists = db.get_chat_messages(&session_id, 500).await.map(|rows| rows.iter().any(|r| r.turn_id == turn_id && r.role == "user")).unwrap_or(false);
        if !exists {
            let _ = db.insert_chat_message(&session_id, "user", &raw, &turn_id).await;
        }
    }
    // Our title, unless it is still the raw id (auto-created rows): then the
    // first prompt names the session, human-readable in the picker.
    let stored_title = db
        .get_session_title(&session_id)
        .await
        .unwrap_or(None)
        .filter(|t| t != &session_id);
    let auto_title: Option<String> = if stored_title.is_none() {
        // Title from the human text, never the executed form (no file refs).
        let excerpt: String = raw.chars().take(48).collect();
        let excerpt = excerpt.replace('\n', " ").trim().to_string();
        if excerpt.is_empty() {
            None
        } else {
            Some(excerpt)
        }
    } else {
        None
    };
    // Engine identity == UI identity: same id, same display name.
    let display_title = stored_title
        .clone()
        .or_else(|| auto_title.clone())
        .unwrap_or_else(|| session_id.clone());

    // Get-or-create the session engine WITHOUT holding the map lock while
    // building (provider init can hit network). A lost create-race just
    // drops our spare; the winner serves every turn through its mutex.
    let engine = {
        let mut engines = ENGINES.lock().await;
        if let Some(e) = engines.get(&session_id) {
            e.clone()
        } else {
            // Agent-owned session: resumes its file when present, else fresh
            // with our id — either way the engine holds the transcript.
            match zw_agent_embed::new_engine(&session_id, &display_title, db.clone()) {
                Ok(mut e) => {
                    e.session_mut().id = session_id.clone().into();
                    e.session_mut().name = display_title.clone().into();
                    let shared =
                        std::sync::Arc::new(tokio::sync::Mutex::new(e));
                    engines.insert(session_id.clone(), shared.clone());
                    shared
                }
                Err(err) => {
                    let _ = event_tx
                        .send(StreamEvent::Error {
                            message: format!("embedded engine init failed: {err:#}"),
                        })
                        .await;
                    return;
                }
            }
        }
    };
    // Adopt the current title (rename-safe), then run serialized: a second
    // prompt on this session waits here instead of forking another engine.
    let mut guard = engine.lock().await;
    guard.session_mut().name = display_title.clone().into();
    let result = zw_agent_embed::run_embedded(
        &mut guard,
        &prompt,
        event_tx.clone(),
        &turn_id,
        abort_slot,
    )
    .await;
    // Transcript lives in the agent (it saves its session file itself).
    // Here we only keep our thread row fresh: title on first turn. B also
    // persists the committed transcript into `chat_messages` so history never
    // needs to `try_lock` a busy engine — it reads DB + replays stream_buffer.
    let assistant_text: Option<String> = match &result {
        Ok(out) if out.kind != zw_agent_embed::engine::RunKind::Ignored && !out.text.trim().is_empty() => Some(out.text.clone()),
        _ => None,
    };
    if let Some(t) = &assistant_text {
        // Guard duplicate done-insert for same turn (e.g. resumed retry).
        let exists = db.get_chat_messages(&session_id, 500).await.map(|rows| rows.iter().any(|r| r.turn_id == turn_id && r.role == "assistant")).unwrap_or(false);
        if !exists {
            let _ = db.insert_chat_message(&session_id, "assistant", t, &turn_id).await;
        }
    }
    if let Ok(out) = &result {
        if out.kind != zw_agent_embed::engine::RunKind::Ignored && !out.text.trim().is_empty() {
            if let Some(t) = auto_title {
                let _ = db.rename_session(&session_id, &t).await;
            }
        }
    }
    // `run_embedded` already sent the closing event on error; nothing to add.
    drop(guard);
    // B: back to idle regardless of outcome — smart callers also look at
    // TASKS+DB status together; the DB flag recovers correctly after restart
    // via `sweep_stale_processing` in main.
    let _ = db.set_session_idle(&session_id).await;
    // Drop our task record — but only if it is still ours and finished: a
    // newer turn's running handle must survive (abort-then-resend race).
    let mut tasks = TASKS.lock().await;
    if tasks
        .get(&session_id)
        .map(|(h, _)| h.is_finished())
        .unwrap_or(false)
    {
        tasks.remove(&session_id);
    }
}

async fn mem_append(session_id: &str, event: serde_json::Value, seq: i64) {
    let mut buf = MEM_BUFFER.lock().await;
    let v = buf.entry(session_id.to_string()).or_default();
    let mut tagged = event;
    if let Some(obj) = tagged.as_object_mut() {
        obj.insert("seq".to_string(), serde_json::json!(seq));
    }
    v.push(tagged);
    if v.len() > 500 {
        let drain = v.len() - 500;
        v.drain(0..drain);
    }
}

async fn mem_replay(session_id: &str, since: i64) -> Vec<serde_json::Value> {
    let buf = MEM_BUFFER.lock().await;
    if let Some(v) = buf.get(session_id) {
        return v
            .iter()
            .filter(|e| e.get("seq").and_then(|s| s.as_i64()).unwrap_or(0) > since)
            .cloned()
            .collect();
    }
    Vec::new()
}

async fn buffer_event(db: &zw_db::DbPool, session_id: &str, event: &StreamEvent) -> Option<serde_json::Value> {
    let mut json = match serde_json::to_value(event) {
        Ok(v) => v,
        Err(_) => return None,
    };
    let seq = match db.stream_buffer_append(session_id, &json).await {
        Ok(s) if s > 0 => s,
        _ => return Some(json),
    };
    if let Some(obj) = json.as_object_mut() {
        obj.insert("seq".to_string(), serde_json::json!(seq));
    }
    mem_append(session_id, json.clone(), seq).await;
    Some(json)
}

fn spawn_whiteboard_forwarding(
    ws_sender: &Arc<tokio::sync::Mutex<futures_util::stream::SplitSink<WebSocket, Message>>>,
    handle: zw_whiteboard::WhiteboardHandle,
    spawned: &mut bool,
) {
    // One shared board: a single forward task per connection, no session
    // filter — every broadcast belongs to every chat session.
    if *spawned {
        return;
    }
    *spawned = true;
    let ws = ws_sender.clone();
    tokio::spawn(async move {
        let mut rx = handle.subscribe();
        loop {
            match rx.recv().await {
                Ok(zw_whiteboard::WhiteboardEvent::BoardUpdate {
                    session_id: sid,
                    state,
                }) => {
                    let flat = serde_json::json!({
                        "type": "whiteboard_update",
                        "session_id": sid,
                        "state": state,
                    });
                    let mut sender = ws.lock().await;
                    if sender.send(Message::Text(flat.to_string().into())).await.is_err() {
                        break;
                    }
                }
                Ok(zw_whiteboard::WhiteboardEvent::WhiteboardUpdate {
                    session_id: sid,
                    board,
                }) => {
                    let flat = serde_json::json!({
                        "type": "whiteboard_update",
                        "session_id": sid,
                        "body_md": board.body_md,
                        "pins": board.pins,
                    });
                    let mut sender = ws.lock().await;
                    if sender.send(Message::Text(flat.to_string().into())).await.is_err() {
                        break;
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
            }
        }
    });
}

pub async fn handle_ws_connection(
    socket: WebSocket,
    whiteboard: Option<zw_whiteboard::WhiteboardHandle>,
    buffer_db: zw_db::DbPool,
) {
    let (ws_sender, mut ws_receiver) = socket.split();
    let ws_sender = Arc::new(tokio::sync::Mutex::new(ws_sender));

    // Proactive agent-status push: the embedded provider check runs on every
    // fresh socket, so a misconfigured key shows in the banner immediately
    // instead of failing on the first chat send. (The daemon watchdog this
    // replaces is gone — no daemon dependency on this path.)
    {
        let health = zw_agent_embed::provider_health();
        let frame = serde_json::json!({
            "type": "agent_status",
            "online": health.get("online").and_then(|v| v.as_bool()).unwrap_or(false),
            "provider": health.get("provider"),
            "model": health.get("model"),
            "reason": health.get("reason"),
        })
        .to_string();
        let mut sender = ws_sender.lock().await;
        let _ = sender.send(Message::Text(frame.into())).await;
    }

    let mut current_session_id = String::new();
    let mut whiteboard_forwarding_for = false;

    // Forward inspect commands from MCP tool to browser tab.
    let ws_inspect = ws_sender.clone();
    let mut inspect_rx = inspect_cmd::subscribe_inspect();
    tokio::spawn(async move {
        loop {
            match inspect_rx.recv().await {
                Ok(cmd) => {
                    let msg = serde_json::json!(cmd);
                    let mut sender = ws_inspect.lock().await;
                    if sender.send(Message::Text(msg.to_string().into())).await.is_err() {
                        break;
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
            }
        }
    });

    while let Some(msg) = ws_receiver.next().await {
        let text = match msg {
            Ok(Message::Text(t)) => t,
            Ok(Message::Close(_)) => break,
            Ok(Message::Ping(_)) => {
                let mut sender = ws_sender.lock().await;
                let _ = sender.send(Message::Pong(vec![].into())).await;
                continue;
            }
            Err(e) => {
                tracing::warn!("WebSocket error: {}", e);
                break;
            }
            _ => continue,
        };

        let parsed: serde_json::Value = match serde_json::from_str(&text) {
            Ok(v) => v,
            Err(e) => {
                let mut sender = ws_sender.lock().await;
                let err = serde_json::json!({"type": "error", "error": format!("Invalid JSON: {}", e)});
                let _ = sender.send(Message::Text(err.to_string().into())).await;
                continue;
            }
        };

        if parsed.get("type").and_then(|v| v.as_str()) == Some("cancel") {
            let sid = parsed.get("session_id")
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
                .or_else(|| {
                    if current_session_id.is_empty() { None } else { Some(current_session_id.as_str()) }
                });
            if let Some(sid) = sid {
                // True cancel: abort the runner via its published handle.
                // Model stream + tool children stop; our task then closes
                // the turn gracefully and the engine is kept. Only when the
                // runner hasn't published yet (pre-drain) fall back to
                // aborting the task itself.
                let record = TASKS.lock().await.remove(sid);
                if let Some((h, slot)) = record {
                    // Runner abort first: model stream + tool children die,
                    // our task then closes the turn gracefully (record is
                    // already out; its end-cleanup becomes a no-op).
                    let runner_aborted = slot
                        .lock()
                        .ok()
                        .and_then(|g| g.clone())
                        .map(|a| {
                            a.abort();
                        })
                        .is_some();
                    if !runner_aborted {
                        h.abort();
                    }
                }
            }
            continue;
        }

        if parsed.get("type").and_then(|v| v.as_str()) == Some("resume") {
            let sid = parsed.get("session_id").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let since = parsed.get("since").and_then(|v| v.as_i64()).unwrap_or(0);
            if !sid.is_empty() {
                current_session_id = sid.clone();
                // Hybrid replay: memory first, then DB for anything not in memory
                let mem = mem_replay(&sid, since).await;
                let mut to_send = mem;
                // If DB has more (e.g. after restart), merge DB replay
                if let Ok(db_events) = buffer_db.stream_buffer_replay(&sid, since).await {
                    // DB events are BufferedEvent; convert to JSON values
                    for be in db_events {
                        if !to_send.iter().any(|v: &serde_json::Value| v.get("seq").and_then(|s| s.as_i64()) == Some(be.seq)) {
                            let mut val = be.payload;
                            if let Some(obj) = val.as_object_mut() {
                                obj.insert("seq".to_string(), serde_json::json!(be.seq));
                            }
                            to_send.push(val);
                        }
                    }
                    to_send.sort_by_key(|v| v.get("seq").and_then(|s| s.as_i64()).unwrap_or(0));
                }
                for val in to_send {
                    let mut sender = ws_sender.lock().await;
                    if sender.send(Message::Text(val.to_string().into())).await.is_err() {
                        break;
                    }
                }
                // Also tell client the current max seq so it can continue
                if let Ok(max) = buffer_db.stream_buffer_max_seq(&sid).await {
                    let ack = serde_json::json!({"type":"resumed","session_id":sid,"since":since,"max_seq":max});
                    let mut sender = ws_sender.lock().await;
                    let _ = sender.send(Message::Text(ack.to_string().into())).await;
                }
            }
            continue;
        }

        if parsed.get("type").and_then(|v| v.as_str()) == Some("whiteboard_sync") {
            let sid = parsed.get("session_id")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            // B: remember the tenant-aware base so `manage_whiteboard set-public`
            // can return https://host/tenant/?wb=slug instead of local /w/slug.
            let base_url = parsed.get("base_url").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let href = parsed.get("href").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let effective_base = if !base_url.is_empty() { base_url } else if !href.is_empty() { href } else { String::new() };
            if !sid.is_empty() && !effective_base.is_empty() {
                set_frontend_base(&sid, effective_base).await;
            }
            if !sid.is_empty() {
                current_session_id = sid.clone();
                if let Some(handle) = whiteboard.clone() {
                    if let Err(e) = handle.ensure(&sid).await {
                        tracing::warn!("whiteboard ensure on sync failed: {}", e);
                    }
                    spawn_whiteboard_forwarding(&ws_sender, handle, &mut whiteboard_forwarding_for);
                }
                let flat = match &whiteboard {
                    Some(handle) => match handle.latest_state(&sid).await {
                        Some(state) => serde_json::json!({
                            "type": "whiteboard_update",
                            "session_id": sid,
                            "state": state,
                        }),
                        None => match handle.latest(&sid).await {
                            Some(board) => serde_json::json!({
                                "type": "whiteboard_update",
                                "session_id": sid,
                                "body_md": board.body_md,
                                "pins": board.pins,
                            }),
                            None => serde_json::json!({
                                "type": "whiteboard_update",
                                "session_id": sid,
                                "body_md": String::new(),
                                "pins": Vec::<String>::new(),
                            }),
                        },
                    },
                    None => serde_json::json!({
                        "type": "whiteboard_update",
                        "session_id": sid,
                        "body_md": String::new(),
                        "pins": Vec::<String>::new(),
                    }),
                };
                let mut sender = ws_sender.lock().await;
                let _ = sender.send(Message::Text(flat.to_string().into())).await;
            }
            continue;
        }

        // Native chat input: session + text only. Daemon-era routing fields
        // (user/channel/role/agent-alias/attachments) are gone — one engine
        // per session, chosen by session_id alone.
        let session_id = parsed.get("session_id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        let content = parsed.get("content")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        if content.trim().is_empty() {
            continue;
        }
        // Attached picker files reach the agent as text references (the
        // engine takes a prompt string). The transcript lives in the agent,
        // so history renders from there (chips are rebuilt from stored
        // paths, never from a wrapper-side copy).
        let mut prompt = content.clone();

        if let Some(arr) = parsed.get("attachments").and_then(|v| v.as_array()) {
            let mut refs = Vec::new();
            for a in arr {
                let name = a.get("filename").and_then(|v| v.as_str()).unwrap_or("");
                if name.is_empty() {
                    continue;
                }
                let loc = a
                    .get("url")
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.is_empty())
                    .map(str::to_string)
                    .or_else(|| {
                        a.get("path")
                            .and_then(|v| v.as_str())
                            .filter(|s| !s.is_empty())
                            .map(str::to_string)
                    })
                    .unwrap_or_default();
                refs.push(if loc.is_empty() {
                    format!("- {name}")
                } else {
                    format!("- {name} ({loc})")
                });
            }
            if !refs.is_empty() {
                prompt.push_str("\n\nAttached files:\n");
                prompt.push_str(&refs.join("\n"));
            }
        }

        current_session_id = session_id.clone();
        if let Some(handle) = whiteboard.clone() {
            spawn_whiteboard_forwarding(&ws_sender, handle, &mut whiteboard_forwarding_for);
        }
        let (event_tx, mut event_rx) = mpsc::channel::<StreamEvent>(256);
        let ws = ws_sender.clone();
        let db_for_buffer = buffer_db.clone();
        let sid_for_buffer = session_id.clone();

        tokio::spawn(async move {
            while let Some(event) = event_rx.recv().await {
                // Hybrid buffer: persist to DB + memory before sending live.
                // This is the ephemeral replay buffer, NOT session message storage.
                let to_send = if let Some(tagged) = buffer_event(&db_for_buffer, &sid_for_buffer, &event).await {
                    tagged
                } else if let Ok(v) = serde_json::to_value(&event) {
                    v
                } else {
                    continue;
                };
                let mut sender = ws.lock().await;
                if sender.send(Message::Text(to_send.to_string().into())).await.is_err() {
                    break;
                }
            }
        });

        // Native path (no daemon, no switch): every prompt runs in-process.
        // Refresh/reconnect never cancels — the turn continues and the
        // stream resumes from the hybrid buffer.
        let sid = session_id.clone();
        let sid_tracked = sid.clone();
        let db_for_turn = buffer_db.clone();
        // Client turn key (dedup across history + replay); server fallback.
        let turn_id = parsed
            .get("turn")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .map(str::to_string)
            .unwrap_or_else(|| {
                let nanos = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_nanos())
                    .unwrap_or(0);
                format!("srv-{nanos:x}")
            });
        let abort_slot: zw_agent_embed::engine::AbortSlot = Default::default();
        let slot_tracked = abort_slot.clone();
        let turn = tokio::spawn(async move {
            run_embedded_turn(
                sid_tracked,
                prompt,
                event_tx,
                db_for_turn,
                turn_id,
                content,
                slot_tracked,
            )
            .await;
        });
        TASKS.lock().await.insert(sid, (turn, abort_slot));
    }

    let mut sender = ws_sender.lock().await;
    let _ = sender.close().await;
}
