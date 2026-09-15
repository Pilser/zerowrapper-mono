use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::unix::{OwnedReadHalf, OwnedWriteHalf};
use tokio::net::UnixStream;
use serde_json::Value;
use tokio::sync::mpsc;
use zw_core::{ZeroClawHandle, ZeroClawCommand, StreamEvent, SessionMessagesResult};
use zw_db::DbPool;

pub struct ZeroClawBridge {
    socket_path: String,
    cmd_tx: tokio::sync::mpsc::Sender<ZeroClawCommand>,
    cmd_rx: Option<tokio::sync::mpsc::Receiver<ZeroClawCommand>>,
    status_tx: tokio::sync::broadcast::Sender<bool>,
    /// Last watchdog reading (shared with handles so late subscribers —
    /// e.g. a freshly opened browser socket — learn the current state
    /// immediately instead of waiting for the next transition).
    status_state: std::sync::Arc<std::sync::Mutex<Option<bool>>>,
    db: DbPool,
    whiteboard: Option<zw_whiteboard::WhiteboardHandle>,
}

impl Clone for ZeroClawBridge {
    fn clone(&self) -> Self {
        Self {
            socket_path: self.socket_path.clone(),
            cmd_tx: self.cmd_tx.clone(),
            cmd_rx: None,
            status_tx: self.status_tx.clone(),
            status_state: self.status_state.clone(),
            db: self.db.clone(),
            whiteboard: self.whiteboard.clone(),
        }
    }
}

struct ZeroClawConnection {
    writer: OwnedWriteHalf,
    reader: BufReader<OwnedReadHalf>,
    next_id: u64,
}

// ── Production reconnect policy ──────────────────────────────────────
// The daemon socket can vanish at any time (daemon restart/deploy). Every
// daemon round-trip below retries TRANSPORT failures (refused/closed/reset)
// with backoff and gives up with a clear error. Application-level daemon
// errors (bad params, provider failures) are never retried.
const RECONNECT_ATTEMPTS: u32 = 8;

fn reconnect_delay(attempt: u32) -> std::time::Duration {
    // 250ms, 500ms, 1s, 2s, 4s, 8s, 8s, 8s (~28s total budget)
    let ms = 250u64.saturating_mul(1 << attempt.min(5)).min(8000);
    std::time::Duration::from_millis(ms)
}

/// True when the error means "the socket died" (retry) as opposed to "the
/// daemon answered with an error" (do not retry).
fn is_transport_error(e: &anyhow::Error) -> bool {
    if let Some(io) = e.downcast_ref::<std::io::Error>() {
        use std::io::ErrorKind::*;
        if matches!(
            io.kind(),
            ConnectionRefused
                | ConnectionReset
                | ConnectionAborted
                | NotConnected
                | BrokenPipe
                | TimedOut
                | Interrupted
                | UnexpectedEof
        ) {
            return true;
        }
    }
    let s = format!("{e:#}").to_lowercase();
    s.contains("connection closed")
        || s.contains("connection reset")
        || s.contains("connection refused")
        || s.contains("broken pipe")
        || s.contains("no such file")
        || s.contains("not connected")
        || s.contains("timed out")
        || s.contains("unexpected eof")
}

impl ZeroClawBridge {
    pub fn new(socket_path: &str, db: DbPool) -> Self {
        let (cmd_tx, cmd_rx) = tokio::sync::mpsc::channel(64);
        let (status_tx, _) = tokio::sync::broadcast::channel(16);
        Self {
            socket_path: socket_path.to_string(),
            cmd_tx,
            cmd_rx: Some(cmd_rx),
            status_tx,
            status_state: std::sync::Arc::new(std::sync::Mutex::new(None)),
            db,
            whiteboard: None,
        }
    }

    pub fn set_whiteboard(&mut self, handle: zw_whiteboard::WhiteboardHandle) {
        self.whiteboard = Some(handle);
    }

    pub fn handle(&self) -> ZeroClawHandle {
        ZeroClawHandle::new(
            self.cmd_tx.clone(),
            self.status_tx.clone(),
            self.status_state.clone(),
        )
    }

    /// Background watchdog: dials the daemon socket every `interval`,
    /// broadcasting reachability changes and logging transitions. Runs until
    /// the returned handle is dropped/aborted. First probe sets baseline
    /// silently (no false "recovered" event at boot).
    pub fn spawn_watchdog(&self, interval: std::time::Duration) -> tokio::task::JoinHandle<()> {
        let socket_path = self.socket_path.clone();
        let status_tx = self.status_tx.clone();
        let status_state = self.status_state.clone();
        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(interval);
            // Skip the immediate first tick so boot doesn't probe mid-startup.
            ticker.tick().await;
            let mut last: Option<bool> = None;
            let mut down_since: Option<std::time::Instant> = None;
            loop {
                ticker.tick().await;
                let online = Self::probe(&socket_path).await;
                // Mirror every reading for late subscribers (fresh browser
                // sockets ask current_status() on connect).
                if let Ok(mut guard) = status_state.lock() {
                    *guard = Some(online);
                }
                match (last, online) {
                    (None, _) => {
                        last = Some(online);
                        // ALWAYS publish the baseline: subscribers (browser
                        // UI banner) start "reconnecting" and only clear on
                        // an online:true frame. Skipping it when the daemon
                        // wins the startup race leaves the UI stuck forever
                        // on a healthy link.
                        let _ = status_tx.send(online);
                        if !online {
                            down_since = Some(std::time::Instant::now());
                            tracing::warn!("ZeroClaw watchdog: daemon socket unreachable at boot: {}", socket_path);
                        } else {
                            tracing::info!("ZeroClaw watchdog: daemon socket OK: {}", socket_path);
                        }
                    }
                    (Some(prev), cur) if prev != cur => {
                        last = Some(cur);
                        if cur {
                            let dark = down_since.map(|t| t.elapsed()).map(|d| format!(" after {d:?}")).unwrap_or_default();
                            tracing::info!("ZeroClaw watchdog: daemon socket recovered{dark}");
                            down_since = None;
                        } else {
                            down_since = Some(std::time::Instant::now());
                            tracing::warn!("ZeroClaw watchdog: daemon socket LOST: {}", socket_path);
                        }
                        let _ = status_tx.send(cur);
                    }
                    _ => {}
                }
            }
        })
    }

    /// Cheap liveness check: connect + initialize handshake, then drop.
    async fn probe(socket_path: &str) -> bool {
        match Self::connect_to(socket_path).await {
            Ok(_) => true,
            Err(e) => {
                tracing::debug!("ZeroClaw watchdog probe failed: {e:#}");
                false
            }
        }
    }

    pub async fn run(mut self) -> anyhow::Result<()> {
        let socket_path = self.socket_path.clone();
        let mut cmd_rx = self.cmd_rx.take().expect("cmd_rx already taken");

        // Process commands from the handle — connect per command (resilient to daemon restart)
        while let Some(cmd) = cmd_rx.recv().await {
            let socket_path = socket_path.clone();
            tokio::spawn(async move {
                if let Err(e) = Self::exec_command(socket_path, cmd).await {
                    tracing::error!("ZeroClaw command failed: {:#}", e);
                }
            });
        }
        Ok(())
    }

    /// Every command branch answers its reply channel — even on connect
    /// failure — so callers never hang on a dropped sender.
    async fn exec_command(socket_path: String, cmd: ZeroClawCommand) -> anyhow::Result<()> {
        match cmd {
            ZeroClawCommand::Prompt { session_id, prompt, reply_tx } => {
                let result = Self::with_reconnect(&socket_path, |mut conn| {
                    let session_id = session_id.clone();
                    let prompt = prompt.clone();
                    async move { conn.prompt(&session_id, &prompt).await }
                })
                .await;
                let _ = reply_tx.send(result);
            }
            ZeroClawCommand::PromptStream { session_id, prompt, event_tx, reply_tx } => {
                let result = Self::with_reconnect(&socket_path, |mut conn| {
                    let session_id = session_id.clone();
                    let prompt = prompt.clone();
                    let event_tx = event_tx.clone();
                    async move { conn.prompt_stream(&session_id, &prompt, &event_tx).await.map(|(text, _)| text) }
                })
                .await;
                let _ = reply_tx.send(result);
            }
            ZeroClawCommand::NewSession { session_id, agent_alias, reply_tx } => {
                let result = Self::with_reconnect(&socket_path, |mut conn| {
                    let session_id = session_id.clone();
                    let agent_alias = agent_alias.clone();
                    async move { conn.new_session(&session_id, &agent_alias).await }
                })
                .await;
                let _ = reply_tx.send(result);
            }
            ZeroClawCommand::GetSessionMessages { session_id, limit, reply_tx } => {
                let result = Self::with_reconnect(&socket_path, |mut conn| {
                    let session_id = session_id.clone();
                    async move { conn.get_session_messages(&session_id, limit).await }
                })
                .await;
                let _ = reply_tx.send(result);
            }
            ZeroClawCommand::Cancel { session_id, reply_tx } => {
                let result = Self::with_reconnect(&socket_path, |mut conn| {
                    let session_id = session_id.clone();
                    async move { conn.cancel_session(&session_id).await }
                })
                .await;
                let _ = reply_tx.send(result);
            }
        }
        Ok(())
    }

    /// Run `op` on a fresh connection, reconnecting with backoff on transport
    /// failures. The op closure must be idempotent across attempts (all our
    /// ops are: new_session is upsert-like, reads are pure).
    async fn with_reconnect<T, F, Fut>(socket_path: &str, op: F) -> anyhow::Result<T>
    where
        F: Fn(ZeroClawConnection) -> Fut,
        Fut: std::future::Future<Output = anyhow::Result<T>>,
    {
        let mut last_err = anyhow::anyhow!("unreachable");
        for attempt in 0..RECONNECT_ATTEMPTS {
            if attempt > 0 {
                let d = reconnect_delay(attempt - 1);
                tracing::warn!("ZeroClaw socket lost, reconnect attempt {attempt}/{RECONNECT_ATTEMPTS} in {d:?}");
                tokio::time::sleep(d).await;
            }
            let conn = match Self::connect_to(socket_path).await {
                Ok(c) => c,
                Err(e) => {
                    last_err = e;
                    if attempt > 0 || is_transport_error(&last_err) {
                        continue;
                    }
                    return Err(last_err);
                }
            };
            match op(conn).await {
                Ok(v) => {
                    if attempt > 0 {
                        tracing::info!("ZeroClaw socket reconnected after {attempt} retries");
                    }
                    return Ok(v);
                }
                Err(e) => {
                    last_err = e;
                    if !is_transport_error(&last_err) {
                        return Err(last_err);
                    }
                }
            }
        }
        Err(anyhow::anyhow!("ZeroClaw daemon unreachable after {RECONNECT_ATTEMPTS} attempts: {last_err:#}"))
    }

    async fn connect_to(socket_path: &str) -> anyhow::Result<ZeroClawConnection> {
        let stream = UnixStream::connect(socket_path)
            .await
            .map_err(|e| anyhow::anyhow!("connect to ZeroClaw socket {}: {}", socket_path, e))?;
        let (reader, writer) = stream.into_split();
        let mut conn = ZeroClawConnection {
            writer,
            reader: BufReader::new(reader),
            next_id: 0,
        };
        conn.send_request("initialize", serde_json::json!({"protocol_version": 1})).await?;
        Ok(conn)
    }

    async fn connect(&self) -> anyhow::Result<ZeroClawConnection> {
        Self::connect_to(&self.socket_path).await
    }

    async fn format_prompt(&self, _user_id: &str, channel: &str, role: &str, attachments: &[zw_core::Attachment], prompt: &str) -> String {
        // Roles arrive as a comma-separated list (from the engine profiles
        // table); present them to the agent as an array. No owner/customer key.
        let roles: Vec<&str> = role.split(',').map(|r| r.trim()).filter(|r| !r.is_empty()).collect();
        let mut envelope = serde_json::json!({
            "message": prompt,
            "channel": channel,
            "roles": roles,
        });
        if !attachments.is_empty() {
            let attach: Vec<serde_json::Value> = attachments.iter().map(|a| {
                let mut entry = serde_json::json!({
                    "filename": a.filename,
                    "mime_type": a.mime_type,
                });
                if !a.path.is_empty() {
                    entry["path"] = serde_json::json!(a.path);
                }
                if !a.data.is_empty() {
                    entry["data"] = serde_json::json!(a.data);
                }
                entry
            }).collect();
            envelope["attachments"] = serde_json::json!(attach);
        }
        envelope.to_string()
    }

    pub async fn process_prompt(&self, session_id: &str, user_id: &str, agent_alias: &str, channel: &str, role: &str, attachments: &[zw_core::Attachment], prompt: &str) -> anyhow::Result<String> {
        // Single-user: simple sess_xxx id, user defaults to "single".
        let user = if user_id.is_empty() || user_id == "anonymous" { "single" } else { user_id };
        let structured_prompt = self.format_prompt(user, channel, role, attachments, prompt).await;
        let socket_path = self.socket_path.clone();
        let session_id = session_id.to_string();
        let agent_alias = agent_alias.to_string();
        let user = user.to_string();
        let db = self.db.clone();
        let whiteboard = self.whiteboard.clone();
        // Whole op is retried: new_session is upsert-like, db writes idempotent.
        // NOTE: non-`move` closure on purpose — with_reconnect needs Fn.
        Self::with_reconnect(&socket_path, |mut conn| {
            let session_id = session_id.clone();
            let agent_alias = agent_alias.clone();
            let user = user.clone();
            let structured_prompt = structured_prompt.clone();
            let db = db.clone();
            let whiteboard = whiteboard.clone();
            async move {
                let actual_session_id = conn.new_session(&session_id, &agent_alias).await?;
                if let Some(wb) = &whiteboard {
                    if let Err(e) = wb.ensure(&actual_session_id).await {
                        tracing::warn!("whiteboard ensure failed: {}", e);
                    }
                }
                if let Err(e) = db.upsert_session(&actual_session_id, &user, &agent_alias, None, None, "web").await {
                    tracing::warn!("Failed to save session to DB: {}", e);
                }
                let _ = db.touch_session(&actual_session_id).await;
                conn.prompt(&actual_session_id, &structured_prompt).await
            }
        })
        .await
    }

    pub async fn process_prompt_stream(
        &self,
        session_id: &str,
        user_id: &str,
        agent_alias: &str,
        channel: &str,
        role: &str,
        attachments: &[zw_core::Attachment],
        prompt: &str,
        event_tx: mpsc::Sender<StreamEvent>,
    ) -> anyhow::Result<String> {
        let user = if user_id.is_empty() || user_id == "anonymous" { "single" } else { user_id };
        let structured_prompt = self.format_prompt(user, channel, role, attachments, prompt).await;
        let socket_path = self.socket_path.clone();
        let session_id = session_id.to_string();
        let agent_alias = agent_alias.to_string();
        let user = user.to_string();
        let db = self.db.clone();
        let whiteboard = self.whiteboard.clone();
        let mut last_err = anyhow::anyhow!("unreachable");
        // Retry only while NOTHING was streamed yet — re-issuing after partial
        // chunks (or tool calls) could duplicate agent side effects.
        for attempt in 0..RECONNECT_ATTEMPTS {
            if attempt > 0 {
                let d = reconnect_delay(attempt - 1);
                tracing::warn!("ZeroClaw stream lost before first event, retry {attempt}/{RECONNECT_ATTEMPTS} in {d:?}");
                tokio::time::sleep(d).await;
            }
            let conn = match Self::connect_to(&socket_path).await {
                Ok(c) => c,
                Err(e) => {
                    last_err = e;
                    if attempt > 0 || is_transport_error(&last_err) {
                        continue;
                    }
                    return Self::fail_stream(&event_tx, last_err).await;
                }
            };
            match Self::stream_once(conn, &session_id, &agent_alias, &user, &structured_prompt, &db, whiteboard.as_ref(), &event_tx).await {
                Ok((text, streamed)) => {
                    if attempt > 0 {
                        tracing::info!("ZeroClaw stream recovered after {attempt} retries");
                    }
                    let _ = streamed;
                    return Ok(text);
                }
                Err((e, streamed)) => {
                    if streamed || !is_transport_error(&e) {
                        return Self::fail_stream(&event_tx, e).await;
                    }
                    last_err = e;
                }
            }
        }
        Self::fail_stream(&event_tx, anyhow::anyhow!("ZeroClaw daemon unreachable after {RECONNECT_ATTEMPTS} attempts: {last_err:#}")).await
    }

    /// Terminal failure: always tell the client (no silent hangs), then Err.
    async fn fail_stream(event_tx: &mpsc::Sender<StreamEvent>, e: anyhow::Error) -> anyhow::Result<String> {
        let msg = format!("{e:#}");
        let _ = event_tx
            .send(StreamEvent::Error { message: format!("Daemon unreachable: {msg}") })
            .await;
        Err(e)
    }

    /// One attempt of open-session + prompt-stream. Returns (text, streamed_any).
    async fn stream_once(
        mut conn: ZeroClawConnection,
        session_id: &str,
        agent_alias: &str,
        user: &str,
        structured_prompt: &str,
        db: &DbPool,
        whiteboard: Option<&zw_whiteboard::WhiteboardHandle>,
        event_tx: &mpsc::Sender<StreamEvent>,
    ) -> Result<(String, bool), (anyhow::Error, bool)> {
        // Intercept events to know whether anything reached the client yet.
        let (inner_tx, mut inner_rx) = mpsc::channel::<StreamEvent>(256);
        let actual_session_id = conn.new_session(session_id, agent_alias).await.map_err(|e| (e, false))?;
        if let Some(wb) = whiteboard {
            if let Err(e) = wb.ensure(&actual_session_id).await {
                tracing::warn!("whiteboard ensure failed: {}", e);
            }
        }
        if let Err(e) = db.upsert_session(&actual_session_id, user, agent_alias, None, None, "web").await {
            tracing::warn!("Failed to save session to DB: {}", e);
        }
        let _ = db.touch_session(&actual_session_id).await;
        // Forwarder: client-visible events + streamed flag.
        let fwd_tx = event_tx.clone();
        let fwd = tokio::spawn(async move {
            let mut any = false;
            while let Some(ev) = inner_rx.recv().await {
                any = true;
                if fwd_tx.send(ev).await.is_err() {
                    break;
                }
            }
            any
        });
        let res = conn.prompt_stream(&actual_session_id, structured_prompt, &inner_tx).await;
        drop(inner_tx);
        let streamed = fwd.await.unwrap_or(false);
        // SessionCreated went direct (not via forwarder); the prompt itself
        // streamed iff the forwarder saw events.
        match res {
            Ok((text, _)) => Ok((text, streamed)),
            Err(e) => Err((e, streamed)),
        }
    }

    pub async fn cancel_session(&self, session_id: &str) -> anyhow::Result<bool> {
        let socket_path = self.socket_path.clone();
        let session_id = session_id.to_string();
        Self::with_reconnect(&socket_path, |mut conn| {
            let session_id = session_id.clone();
            async move { conn.cancel_session(&session_id).await }
        })
        .await
    }

    pub async fn get_session_messages(
        &self,
        session_id: &str,
        limit: Option<usize>,
    ) -> anyhow::Result<SessionMessagesResult> {
        let socket_path = self.socket_path.clone();
        let session_id = session_id.to_string();
        Self::with_reconnect(&socket_path, |mut conn| {
            let session_id = session_id.clone();
            async move { conn.get_session_messages(&session_id, limit).await }
        })
        .await
    }
}

impl ZeroClawConnection {
    async fn new_session(&mut self, session_id: &str, agent_alias: &str) -> anyhow::Result<String> {
        let params = serde_json::json!({
            "agent_alias": agent_alias,
            "session_id": session_id,
        });
        let result = self.send_request("session/new", params).await?;
        let daemon_session_id = result.get("session_id")
            .and_then(|v| v.as_str())
            .unwrap_or(session_id)
            .to_string();
        Ok(daemon_session_id)
    }

    async fn prompt(&mut self, session_id: &str, prompt: &str) -> anyhow::Result<String> {
        let params = serde_json::json!({
            "session_id": session_id,
            "prompt": prompt,
        });

        self.next_id += 1;
        let req_id = self.next_id;
        let raw = serde_json::to_string(&serde_json::json!({
            "jsonrpc": "2.0",
            "id": req_id,
            "method": "session/prompt",
            "params": params,
        }))?;
        let mut line = raw;
        line.push('\n');
        self.writer.write_all(line.as_bytes()).await?;

        let mut full_text = String::new();
        loop {
            let mut buf = String::new();
            let n = self.reader.read_line(&mut buf).await?;
            if n == 0 {
                anyhow::bail!("ZeroClaw connection closed");
            }
            let trimmed = buf.trim();

            if let Ok(resp) = serde_json::from_str::<Value>(trimmed) {
                if resp.get("id").and_then(|id| id.as_u64()) == Some(req_id) {
                    if let Some(result) = resp.get("result") {
                        if let Some(content) = result.get("content").and_then(|c| c.as_str()) {
                            if !content.is_empty() {
                                full_text = content.to_string();
                            }
                        }
                    }
                    if let Some(err) = resp.get("error") {
                        let code = err.get("code").and_then(|c| c.as_i64()).unwrap_or(0);
                        let message = err.get("message").and_then(|m| m.as_str()).unwrap_or("unknown");
                        anyhow::bail!("ZeroClaw error ({}): {}", code, message);
                    }
                    return Ok(full_text);
                }

                if resp.get("method").and_then(|m| m.as_str()) == Some("session/update") {
                    if let Some(params) = resp.get("params") {
                        if let Some(text) = params.get("text").and_then(|t| t.as_str()) {
                            full_text.push_str(text);
                        }
                        if let Some(event_type) = params.get("type").and_then(|t| t.as_str()) {
                            if event_type == "turn_complete" {
                                if let Some(content) = params.get("content").and_then(|c| c.as_str()) {
                                    if !content.is_empty() {
                                        full_text = content.to_string();
                                    }
                                }
                                return Ok(full_text);
                            }
                        }
                    }
                }
            }
        }
    }

    /// Returns (full_text, streamed_any): whether anything reached the
    /// client determines if a transport failure may be retried safely.
    async fn prompt_stream(
        &mut self,
        session_id: &str,
        prompt: &str,
        event_tx: &mpsc::Sender<StreamEvent>,
    ) -> anyhow::Result<(String, bool)> {
        let params = serde_json::json!({
            "session_id": session_id,
            "prompt": prompt,
        });

        self.next_id += 1;
        let req_id = self.next_id;
        let raw = serde_json::to_string(&serde_json::json!({
            "jsonrpc": "2.0",
            "id": req_id,
            "method": "session/prompt",
            "params": params,
        }))?;
        let mut line = raw;
        line.push('\n');
        self.writer.write_all(line.as_bytes()).await?;

        let mut full_text = String::new();
        // Assigned on every path that reads it (id-match and update arms);
        // the no-event bail paths never read it.
        let mut streamed: bool;
        loop {
            let mut buf = String::new();
            let n = self.reader.read_line(&mut buf).await?;
            if n == 0 {
                anyhow::bail!("ZeroClaw connection closed");
            }
            let trimmed = buf.trim();

            if let Ok(resp) = serde_json::from_str::<Value>(trimmed) {
                if resp.get("id").and_then(|id| id.as_u64()) == Some(req_id) {
                    streamed = true;
                    if let Some(err) = resp.get("error") {
                        let code = err.get("code").and_then(|c| c.as_i64()).unwrap_or(0);
                        let message = err.get("message").and_then(|m| m.as_str()).unwrap_or("unknown");
                        let _ = event_tx.send(StreamEvent::Error { message: format!("ZeroClaw error ({}): {}", code, message) }).await;
                        anyhow::bail!("ZeroClaw error ({}): {}", code, message);
                    }
                    if let Some(result) = resp.get("result") {
                        if let Some(content) = result.get("content").and_then(|c| c.as_str()) {
                            if !content.is_empty() {
                                full_text = content.to_string();
                                let _ = event_tx.send(StreamEvent::Done { content: content.to_string(), turn_id: String::new() }).await;
                            }
                        }
                    }
                    let _ = event_tx.send(StreamEvent::ChunkReset).await;
                    return Ok((full_text, streamed));
                }

                if resp.get("method").and_then(|m| m.as_str()) == Some("session/update") {
                    streamed = true;
                    if let Some(params) = resp.get("params") {
                        let event_type = params.get("type").and_then(|t| t.as_str()).unwrap_or("");

                        match event_type {
                            "agent_thought_chunk" => {
                                if let Some(text) = params.get("text").and_then(|t| t.as_str()) {
                                    let _ = event_tx.send(StreamEvent::Thinking { content: text.to_string() }).await;
                                }
                            }
                            "agent_message_chunk" => {
                                if let Some(text) = params.get("text").and_then(|t| t.as_str()) {
                                    full_text.push_str(text);
                                    let _ = event_tx.send(StreamEvent::Chunk { content: text.to_string() }).await;
                                }
                            }
                            "tool_call" => {
                                let tool_call_id = params.get("tool_call_id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                let name = params.get("name").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
                                let args = params.get("raw_input").cloned().unwrap_or(Value::Null);
                                let _ = event_tx.send(StreamEvent::ToolCall { tool_call_id, name, args }).await;
                            }
                            "tool_result" => {
                                let tool_call_id = params.get("tool_call_id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                let name = params.get("name").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
                                let output = params.get("raw_output").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                let _ = event_tx.send(StreamEvent::ToolResult { tool_call_id, name, output }).await;
                            }
                            "turn_complete" => {
                                let content = params.get("content").and_then(|c| c.as_str()).unwrap_or("");
                                if !content.is_empty() {
                                    full_text = content.to_string();
                                }
                                let _ = event_tx.send(StreamEvent::ChunkReset).await;
                                let _ = event_tx.send(StreamEvent::Done { content: full_text.clone(), turn_id: String::new() }).await;
                                return Ok((full_text, streamed));
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }

    async fn cancel_session(&mut self, session_id: &str) -> anyhow::Result<bool> {
        let params = serde_json::json!({
            "session_id": session_id,
        });
        let result = self.send_request("session/cancel", params).await?;
        Ok(result.get("cancelled").and_then(|v| v.as_bool()).unwrap_or(false))
    }

    async fn get_session_messages(&mut self, session_id: &str, limit: Option<usize>) -> anyhow::Result<SessionMessagesResult> {
        let params = serde_json::json!({
            "session_id": session_id,
            "limit": limit.unwrap_or(100),
        });
        let result = self.send_request("session/messages", params).await?;
        let messages_result: SessionMessagesResult = serde_json::from_value(result)
            .map_err(|e| anyhow::anyhow!("failed to parse session messages: {}", e))?;
        Ok(messages_result)
    }

    async fn send_request(&mut self, method: &str, params: Value) -> anyhow::Result<Value> {
        self.next_id += 1;
        let req_id = self.next_id;
        let raw = serde_json::to_string(&serde_json::json!({
            "jsonrpc": "2.0",
            "id": req_id,
            "method": method,
            "params": params,
        }))?;
        let mut line = raw;
        line.push('\n');
        self.writer.write_all(line.as_bytes()).await?;

        loop {
            let mut buf = String::new();
            let n = self.reader.read_line(&mut buf).await?;
            if n == 0 {
                anyhow::bail!("ZeroClaw connection closed while waiting for {}", method);
            }
            let trimmed = buf.trim();

            if let Ok(resp) = serde_json::from_str::<Value>(trimmed) {
                if let Some(id) = resp.get("id").and_then(|id| id.as_u64()) {
                    if id == req_id {
                        if let Some(err) = resp.get("error") {
                            let code = err.get("code").and_then(|c| c.as_i64()).unwrap_or(0);
                            let message = err.get("message").and_then(|m| m.as_str()).unwrap_or("unknown");
                            anyhow::bail!("ZeroClaw {} error ({}): {}", method, code, message);
                        }
                        if let Some(result) = resp.get("result") {
                            return Ok(result.clone());
                        }
                        return Ok(serde_json::json!({}));
                    }
                }
            }
        }
    }
}
