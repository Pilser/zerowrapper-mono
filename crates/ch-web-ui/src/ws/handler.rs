use std::collections::HashMap;
use std::sync::Arc;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use topcoat::router::content::websocket::{Message, WebSocket};
use zw_core::StreamEvent;
use zw_mcp::inspect_cmd;

// Ephemeral replay buffer: hybrid memory + DB. Memory for fast reconnect
// within the same process, DB for cross-restart resumption. This is NOT
// session message storage — agent DB remains the source of truth for
// history. Buffer drains 10 min after turn_complete, 60 min for orphaned.
use std::sync::LazyLock;
static MEM_BUFFER: LazyLock<tokio::sync::Mutex<HashMap<String, Vec<serde_json::Value>>>> =
    LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

// Native engines, one per chat session. The lock is only held to take or
// return an engine — never across a turn — so sessions never block each other.
// There is no daemon path anymore: every prompt runs here, in-process.
static ENGINES: LazyLock<
    tokio::sync::Mutex<HashMap<String, zw_agent_embed::engine::Engine>>,
> = LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

// In-flight native turns, one JoinHandle per session. Cancel = abort the
// handle (the engine goes down with it; next message builds a fresh one,
// history display intact). Refresh/reconnect never cancels: the turn keeps
// running and the stream resumes from the buffer.
static TASKS: LazyLock<
    tokio::sync::Mutex<HashMap<String, tokio::task::JoinHandle<()>>>,
> = LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

/// Live native sessions for the picker: id, display name, model/provider,
/// message count, token totals and cost — straight from the engines.
/// Sorted newest-first by engine `updated_at`.
pub async fn agent_session_list() -> Vec<serde_json::Value> {
    let engines = ENGINES.lock().await;
    let mut out: Vec<serde_json::Value> = engines
        .iter()
        .map(|(sid, e)| {
            let s = e.session();
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
            })
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

/// Transcript straight from the agent: live engine first, its session file
/// on disk second. This is what history displays — the wrapper keeps no
/// parallel transcript (its old `chat_messages` rows, if any, are ignored).
pub async fn engine_history(session_id: &str) -> Vec<zw_agent_embed::HistoryMsg> {
    {
        let engines = ENGINES.lock().await;
        if let Some(e) = engines.get(session_id) {
            return zw_agent_embed::session_history(e);
        }
    }
    zw_agent_embed::load_session_history(session_id).unwrap_or_default()
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
) {
    let _ = db.touch_session(&session_id).await;
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

    let engine = {
        let mut engines = ENGINES.lock().await;
        if let Some(mut e) = engines.remove(&session_id) {
            e.session_mut().name = display_title.clone().into();
            Some(e)
        } else {
            // Agent-owned session: resumes its file when present, else fresh
            // with our id — either way the engine holds the transcript.
            match zw_agent_embed::new_engine(&session_id, &display_title) {
                Ok(mut e) => {
                    e.session_mut().id = session_id.clone().into();
                    e.session_mut().name = display_title.clone().into();
                    Some(e)
                }
                Err(err) => {
                    let _ = event_tx
                        .send(StreamEvent::Error {
                            message: format!("embedded engine init failed: {err:#}"),
                        })
                        .await;
                    None
                }
            }
        }
    };
    let Some(mut engine) = engine else { return };
    let result =
        zw_agent_embed::run_embedded(&mut engine, &prompt, event_tx.clone(), &turn_id).await;
    // Transcript lives in the agent (it saves its session file itself).
    // Here we only keep our thread row fresh: title on first turn.
    if let Ok(out) = &result {
        if out.kind != zw_agent_embed::engine::RunKind::Ignored && !out.text.trim().is_empty() {
            if let Some(t) = auto_title {
                let _ = db.rename_session(&session_id, &t).await;
            }
        }
    }
    // `run_embedded` already sent the closing event on error; nothing to add.
    ENGINES.lock().await.insert(session_id.clone(), engine);
    // Drop our task record — but only if it is still ours and finished: a
    // newer turn's running handle must survive (abort-then-resend race).
    let mut tasks = TASKS.lock().await;
    if tasks
        .get(&session_id)
        .map(|h| h.is_finished())
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
                // Native cancel: abort the in-flight turn. The engine is
                // dropped with it; the next message starts a fresh engine
                // (agent context restarts, chat history display is intact).
                if let Some(h) = TASKS.lock().await.remove(sid) {
                    h.abort();
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
        let turn = tokio::spawn(async move {
            run_embedded_turn(sid_tracked, prompt, event_tx, db_for_turn, turn_id, content).await;
        });
        TASKS.lock().await.insert(sid, turn);
    }

    let mut sender = ws_sender.lock().await;
    let _ = sender.close().await;
}
