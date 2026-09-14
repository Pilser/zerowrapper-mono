use std::collections::HashMap;
use std::sync::Arc;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use topcoat::router::content::websocket::{Message, WebSocket};
use zw_core::{Attachment, ChannelMessage, ChannelRegistryHandle, ZeroClawHandle, StreamEvent};
use zw_mcp::inspect_cmd;

// Ephemeral replay buffer: hybrid memory + DB. Memory for fast reconnect
// within the same process, DB for cross-restart resumption. This is NOT
// session message storage — agent DB remains the source of truth for
// history. Buffer drains 10 min after turn_complete, 60 min for orphaned.
use std::sync::LazyLock;
static MEM_BUFFER: LazyLock<tokio::sync::Mutex<HashMap<String, Vec<serde_json::Value>>>> =
    LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

// Embedded engines, one per chat session. The lock is only held to take or
// return an engine — never across a turn — so sessions never block each other.
// The daemon path is untouched; `ZEROWRAPPER_ENGINE=embedded` selects this.
static ENGINES: LazyLock<
    tokio::sync::Mutex<HashMap<String, zw_agent_embed::engine::Engine>>,
> = LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

/// Drive one prompt through the in-process zerostack engine, emitting the
/// same typed `StreamEvent`s as the daemon path (buffer/resume unchanged).
async fn run_embedded_turn(
    session_id: String,
    prompt: String,
    event_tx: mpsc::Sender<StreamEvent>,
) {
    let engine = {
        let mut engines = ENGINES.lock().await;
        if let Some(e) = engines.remove(&session_id) {
            Some(e)
        } else {
            match zw_agent_embed::new_engine(&format!("zw-{session_id}")) {
                Ok(e) => Some(e),
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
    if zw_agent_embed::run_embedded(&mut engine, &prompt, event_tx.clone())
        .await
        .is_err()
    {
        // `run_embedded` already sent the closing `Error`; nothing to add.
    }
    ENGINES.lock().await.insert(session_id, engine);
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
    session_id: String,
    spawned: &mut Option<String>,
) {
    if spawned.as_deref() == Some(session_id.as_str()) {
        return;
    }
    *spawned = Some(session_id.clone());
    let ws = ws_sender.clone();
    tokio::spawn(async move {
        let mut rx = handle.subscribe();
        loop {
            match rx.recv().await {
                Ok(zw_whiteboard::WhiteboardEvent::BoardUpdate {
                    session_id: sid,
                    state,
                }) => {
                    if sid != session_id {
                        continue;
                    }
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
                    if sid != session_id {
                        continue;
                    }
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
    registry: ChannelRegistryHandle,
    zeroclaw: Arc<ZeroClawHandle>,
    agent: Arc<String>,
    whiteboard: Option<zw_whiteboard::WhiteboardHandle>,
    buffer_db: zw_db::DbPool,
) {
    let (ws_sender, mut ws_receiver) = socket.split();
    let ws_sender = Arc::new(tokio::sync::Mutex::new(ws_sender));

    // Proactive daemon-status push: watchdog transitions become visible in
    // the browser without waiting for a chat send to fail. Plus an immediate
    // frame with the latest known reading: broadcast has no replay, so a
    // fresh socket would otherwise wait for the next transition (and the UI
    // banner would sit on "reconnecting" despite a healthy link).
    if let Some(online) = zeroclaw.current_status() {
        let frame = serde_json::json!({"type": "daemon_status", "online": online}).to_string();
        let mut sender = ws_sender.lock().await;
        let _ = sender.send(Message::Text(frame.into())).await;
    }
    {
        let ws = ws_sender.clone();
        let mut status_rx = zeroclaw.subscribe_status();
        tokio::spawn(async move {
            loop {
                match status_rx.recv().await {
                    Ok(online) => {
                        let frame = serde_json::json!({"type": "daemon_status", "online": online}).to_string();
                        let mut sender = ws.lock().await;
                        if sender.send(Message::Text(frame.into())).await.is_err() {
                            break;
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                }
            }
        });
    }

    let mut current_session_id = String::new();
    let mut whiteboard_forwarding_for: Option<String> = None;

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
                let _ = zeroclaw.cancel_session(sid.to_string()).await;
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
                    spawn_whiteboard_forwarding(&ws_sender, handle, sid.clone(), &mut whiteboard_forwarding_for);
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

        let session_id = parsed.get("session_id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        let user_id = parsed.get("user_id")
            .and_then(|v| v.as_str())
            .unwrap_or("anonymous");
        let content = parsed.get("content")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let role = parsed.get("roles")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|r| r.as_str()).collect::<Vec<_>>().join(","))
            .or_else(|| parsed.get("role").and_then(|v| v.as_str()).map(str::to_string))
            .unwrap_or_else(|| "public".to_string());

        let attachments = parsed.get("attachments")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|a| {
                        let filename = a.get("filename").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        if filename.is_empty() && a.get("path").and_then(|v| v.as_str()).unwrap_or("").is_empty() {
                            return None;
                        }
                        Some(Attachment {
                            filename,
                            mime_type: a.get("mime_type").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                            data: Vec::new(),
                            path: a.get("path").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        })
                    })
                    .collect::<Vec<Attachment>>()
            })
            .unwrap_or_default();

        let msg = ChannelMessage {
            channel: "web".to_string(),
            session_id: session_id.clone(),
            user_id: user_id.to_string(),
            content: content.to_string(),
            agent_alias: agent.to_string(),
            role: role.to_string(),
            attachments,
        };

        current_session_id = session_id.clone();
        if let Some(handle) = whiteboard.clone() {
            spawn_whiteboard_forwarding(&ws_sender, handle, current_session_id.clone(), &mut whiteboard_forwarding_for);
        }
        let (event_tx, mut event_rx) = mpsc::channel::<StreamEvent>(256);
        let ws = ws_sender.clone();
        let registry = registry.clone();
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

        if std::env::var("ZEROWRAPPER_ENGINE").as_deref() == Ok("embedded") {
            let prompt = msg.content.clone();
            let sid = msg.session_id.clone();
            tokio::spawn(async move {
                run_embedded_turn(sid, prompt, event_tx).await;
            });
        } else {
            tokio::spawn(async move {
                let _ = registry.route_incoming_stream(msg, event_tx).await;
            });
        }
    }

    let mut sender = ws_sender.lock().await;
    let _ = sender.close().await;
}
