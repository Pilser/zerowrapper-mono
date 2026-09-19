//! In-process zerostack engine for zerowrapper ("embedded" backend).
//!
//! Structured stream, end to end: every [`AgentEvent`] maps 1:1 to a typed
//! [`StreamEvent`] — no text scraping, no regex. Call pairing is by typed
//! `call_id`, never by "most recent call". The existing ws buffer task
//! (`buffer_event` + `stream_buffer` resume) consumes these unchanged.

pub mod engine {
    pub use ::zerostack::engine::*;
}

pub mod ask;
pub use ask::{AskEvent, AskUserProvider, publish_answer};

use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

use tokio::sync::mpsc;
use zerostack::engine::{Engine, RunOutput};
use zerostack::event::AgentEvent;
use zw_core::StreamEvent;

/// One tool step inside a turn's trace pile: what was called, with what,
/// what came back, and the agent's own short note when it wrote one.
#[derive(Debug, Clone, Default, serde::Serialize)]
pub struct TracedTool {
    pub call_id: String,
    pub name: String,
    pub args: serde_json::Value,
    pub output: Option<String>,
    pub note: String,
}

/// Structured per-turn trace pile: thinking bursts + tool steps in order.
/// Built live as events forward; persisted as one `role='trace'` row and
/// rendered on history load through the same pile builders as live.
#[derive(Debug, Clone, Default, serde::Serialize)]
pub struct TurnTrace {
    pub thinking: String,
    pub thought_count: usize,
    pub tools: Vec<TracedTool>,
}

impl TurnTrace {
    pub fn is_empty(&self) -> bool {
        self.thinking.trim().is_empty() && self.tools.is_empty()
    }

    fn trunc(s: &str, n: usize) -> String {
        let t = s.trim();
        if t.chars().count() <= n {
            return t.to_string();
        }
        let mut out: String = t.chars().take(n).collect();
        out.push('…');
        out
    }

    /// Note for one tool call: agent-written `note` arg wins, else "".
    /// (Wrapper-derived fallback notes arrive in Phase 2; raw name/args
    /// stay in the payload for the details view either way.)
    fn tool_note(args: &serde_json::Value) -> String {
        args.get("note")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .trim()
            .to_string()
    }

    /// Capped JSON for the durable trace row / history payload: thinking
    /// 8000 chars, args 2000, output 2000, at most 300 tools. Bounds the
    /// row and the history response for very long turns.
    pub fn to_capped_json(&self) -> String {
        let tools: Vec<serde_json::Value> = self
            .tools
            .iter()
            .take(300)
            .map(|t| {
                let args_str = serde_json::to_string(&t.args).unwrap_or_default();
                serde_json::json!({
                    "id": t.call_id,
                    "name": t.name,
                    "args": serde_json::from_str::<serde_json::Value>(&args_str).unwrap_or(serde_json::Value::Null),
                    "args_text": Self::trunc(&args_str, 2000),
                    "output": t.output.as_deref().map(|o| Self::trunc(o, 2000)),
                    "note": t.note,
                })
            })
            .collect();
        serde_json::json!({
            "thinking": Self::trunc(&self.thinking, 8000),
            "thought_count": self.thought_count,
            "tools": tools,
            "tool_count": self.tools.len(),
        })
        .to_string()
    }
}

/// What one embedded turn produced: the engine output, whether a final
/// answer was seen, and the structured trace pile for history rendering.
pub struct EmbeddedTurn {
    pub output: RunOutput,
    pub completed: bool,
    pub trace: TurnTrace,
}

/// Map one engine event to the wire event.
///
/// `CompletionCall` carries only usage accounting (already folded into
/// `RunOutput::usage`) → `None`.
pub fn map_event(ev: AgentEvent, turn_id: &str) -> Option<StreamEvent> {
    match ev {
        AgentEvent::Token(t) => Some(StreamEvent::Chunk {
            content: t.to_string(),
        }),
        AgentEvent::Reasoning(t) => Some(StreamEvent::Thinking {
            content: t.to_string(),
        }),
        AgentEvent::ToolCall {
            call_id,
            name,
            args,
        } => Some(StreamEvent::ToolCall {
            tool_call_id: call_id.to_string(),
            name: name.to_string(),
            args,
        }),
        AgentEvent::ToolResult {
            call_id,
            name,
            output,
        } => Some(StreamEvent::ToolResult {
            tool_call_id: call_id.to_string(),
            name: name.to_string(),
            output: output.to_string(),
        }),
        // Present because we build with `acp`; nested under no parent on the
        // wire — the name carries the origin.
        AgentEvent::SubagentToolCall { name, args } => Some(StreamEvent::ToolCall {
            tool_call_id: format!("subagent:{}", name),
            name: name.to_string(),
            args,
        }),
        // Engine cleared its response buffer (e.g. retrying) → same for us.
        AgentEvent::Retrying { .. } => Some(StreamEvent::ChunkReset),
        AgentEvent::CompletionCall { .. } => None,
        AgentEvent::Done { response, .. } => Some(StreamEvent::Done {
            content: response.to_string(),
            turn_id: turn_id.to_string(),
        }),
        AgentEvent::Error(e) => Some(StreamEvent::Error {
            message: e.to_string(),
        }),
    }
}

/// Compact, structured summary of what a turn actually did, built from its
/// turn-stamped engine messages. Used when a turn ends without a final
/// answer (budget/stall/early stop) so durable history keeps the last
/// content instead of nothing or a raw error transcript.
/// Returns None when the turn left no trace (no tool calls, no partial text).
pub fn summarize_turn(session: &zerostack::session::Session, turn_id: &str) -> Option<String> {
    use zerostack::session::MessageRole;
    fn trunc(s: &str, n: usize) -> String {
        let t = s.trim();
        if t.chars().count() <= n {
            return t.to_string();
        }
        let mut out: String = t.chars().take(n).collect();
        out.push('…');
        out
    }
    let mut calls = 0usize;
    let mut results = 0usize;
    let mut last_call: Option<&str> = None;
    let mut last_result: Option<&str> = None;
    let mut partial = String::new();
    for m in &session.messages {
        if m.turn.as_deref() != Some(turn_id) {
            continue;
        }
        match m.role {
            MessageRole::ToolCall | MessageRole::SubagentToolCall => {
                calls += 1;
                if matches!(m.role, MessageRole::ToolCall) {
                    last_call = Some(m.content.as_str());
                }
            }
            MessageRole::ToolResult => {
                results += 1;
                last_result = Some(m.content.as_str());
            }
            MessageRole::Assistant => {
                if !partial.is_empty() {
                    partial.push('\n');
                }
                partial.push_str(m.content.as_str());
            }
            _ => {}
        }
    }
    if calls == 0 && partial.trim().is_empty() {
        return None;
    }
    let mut s = format!(
        "Turn ended with no final answer after {calls} tool calls ({results} results)."
    );
    if let Some(c) = last_call {
        s.push_str(&format!(" Last action: {}", trunc(c, 300)));
        if let Some(r) = last_result {
            s.push_str(&format!(" → {}", trunc(r, 300)));
        }
    }
    if !partial.trim().is_empty() {
        s.push_str(&format!(" Partial answer: {}", trunc(&partial, 500)));
    }
    Some(s)
}

/// Run one prompt on `engine`, forwarding the live structured stream into the
/// same `event_tx` the ws buffer task already drains (resume/seq unchanged).
///
/// Terminal-event guarantee: exactly one closing event per turn. The tap
/// forwards `Done` on the happy path; if the engine caught the failure
/// internally (`Error` forwarded, transcript returned as `Ok`) or
/// `run_streaming` itself failed, a closing `Done`/`Error` is synthesized
/// here so the frontend always finalizes.
///
/// Returns an [`EmbeddedTurn`]: output, whether a final answer was seen,
/// and the structured trace pile. When no `Done` was seen the raw error
/// transcript is replaced with [`summarize_turn`] output when the turn left
/// any trace, so both the live closing bubble and the committed history keep
/// the last content instead of just `error: …`.
pub async fn run_embedded(
    engine: &mut Engine,
    prompt: &str,
    event_tx: mpsc::Sender<StreamEvent>,
    turn_id: &str,
    abort_slot: ::zerostack::engine::AbortSlot,
) -> anyhow::Result<EmbeddedTurn> {
    let (agent_tx, mut agent_rx) = mpsc::channel::<AgentEvent>(512);
    // Per-turn ask notifier: the session-bound `ask_user` tool pushes here,
    // this task forwards into the event stream (buffered ⇒ drop-safe).
    // Correctness never depends on it — the drawer polls pending too.
    let (ask_tx, mut ask_rx) = mpsc::channel::<AskEvent>(16);
    let sid_for_bus = engine.session().id.to_string();
    if let Some(bus) = ask::bus_for(&sid_for_bus) {
        bus.arm(ask_tx);
    }
    let ask_tx_forward = event_tx.clone();
    let ask_forward = tokio::spawn(async move {
        while let Some(ev) = ask_rx.recv().await {
            let se = StreamEvent::AskRequest {
                ask_id: ev.ask_id,
                session_id: ev.session_id,
                questions: ev.questions,
            };
            if ask_tx_forward.send(se).await.is_err() {
                break;
            }
        }
    });
    let done_seen = Arc::new(AtomicBool::new(false));
    let done_flag = done_seen.clone();
    // Structured trace pile accumulated as events forward (brief lock, never
    // held across await). Thinking + tool steps; chunks excluded (they form
    // the answer bubble). Persisted as one trace row, rendered on history.
    let trace_acc: Arc<std::sync::Mutex<TurnTrace>> =
        Arc::new(std::sync::Mutex::new(TurnTrace::default()));
    let trace_fwd = trace_acc.clone();
    // Clone: the original stays with us for the synthesized closing event.
    let tx_forward = event_tx.clone();
    let turn_owned = turn_id.to_string();
    let forward = tokio::spawn(async move {
        while let Some(ev) = agent_rx.recv().await {
            if matches!(ev, AgentEvent::Done { .. }) {
                done_flag.store(true, Ordering::Relaxed);
            }
            {
                let mut t = trace_fwd.lock().unwrap_or_else(|e| e.into_inner());
                match &ev {
                    AgentEvent::Reasoning(text) => {
                        t.thinking.push_str(text);
                        t.thought_count += 1;
                    }
                    AgentEvent::ToolCall { call_id, name, args } => {
                        t.tools.push(TracedTool {
                            call_id: call_id.to_string(),
                            name: name.to_string(),
                            args: args.clone(),
                            output: None,
                            note: TurnTrace::tool_note(args),
                        });
                    }
                    AgentEvent::ToolResult { call_id, output, .. } => {
                        if let Some(tool) =
                            t.tools.iter_mut().rev().find(|x| x.call_id == call_id.as_str())
                        {
                            tool.output = Some(output.to_string());
                        }
                    }
                    _ => {}
                }
            }
            if let Some(se) = map_event(ev, &turn_owned) {
                if tx_forward.send(se).await.is_err() {
                    break;
                }
            }
        }
    });

    // Arm true-cancel BEFORE the turn starts so the drain loop publishes
    // the runner's abort handle into our slot.
    engine.set_abort_slot(abort_slot);
    let mut out = engine
        .run_streaming(prompt, agent_tx, Some(turn_id.to_string()))
        .await;
    // `agent_tx` moved into `run_streaming` and drops on return → the
    // forward task drains the remainder and ends. Same for the ask channel:
    // disarm first so its sender drops and the forwarder finishes.
    let _ = forward.await;
    if let Some(bus) = ask::bus_for(&sid_for_bus) {
        bus.disarm();
    }
    let _ = ask_forward.await;

    let completed = done_seen.load(Ordering::Relaxed);
    let trace = trace_acc
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .clone();
    match &mut out {
        Ok(o) => {
            if let Some(u) = &o.usage {
                tracing::info!(
                    kind = ?o.kind,
                    input_tokens = u.input_tokens,
                    output_tokens = u.output_tokens,
                    "embedded turn complete"
                );
            }
            if !completed {
                // No final answer: swap the raw error transcript for the
                // structured turn summary when the turn left any trace.
                if let Some(summary) = summarize_turn(engine.session(), turn_id) {
                    o.text = summary;
                }
                // Engine-resolved turn (slash command, rolled-back error
                // transcript, …): close it explicitly so the UI finalizes.
                let _ = event_tx
                    .send(StreamEvent::Done {
                        content: o.text.clone(),
                        turn_id: turn_id.to_string(),
                    })
                    .await;
            }
        }
        Err(e) => {
            let _ = event_tx
                .send(StreamEvent::Error {
                    message: format!("{e:#}"),
                })
                .await;
        }
    }
    out.map(|o| EmbeddedTurn {
        output: o,
        completed,
        trace,
    })
}

/// Provider health for the status banner / `/health`, without burning API
/// calls: config loads, provider+model resolve, and the fork's own auth
/// resolver finds a key (env/config/CLI). No network involved.
pub fn provider_health() -> serde_json::Value {
    use zerostack::{auth::ProviderKind, cli::Cli, config, provider};

    let cli = Cli {
        no_session: true,
        ..Default::default()
    };
    let (cfg, _) = config::load();
    let provider_name = cli.resolve_provider(&cfg).to_string();
    let model = cli.resolve_model(&cfg).to_string();
    let custom = cfg.custom_providers_map();
    let pcfg = match provider::resolve_provider_config(&provider_name, &custom) {
        Ok(p) => p,
        Err(e) => {
            return serde_json::json!({
                "online": false, "provider": provider_name, "model": model,
                "reason": format!("unknown provider: {e:#}"),
            })
        }
    };
    // Local backends need no key.
    if matches!(pcfg.kind, ProviderKind::Ollama) {
        return serde_json::json!({
            "online": true, "provider": provider_name, "model": model,
            "reason": "local provider",
        });
    }
    let key = zerostack::auth::AuthResolver::new(pcfg.kind)
        .with_cli_key(cli.api_key.as_deref())
        .with_env_override(pcfg.api_key_env.as_deref())
        .with_config_keys(cfg.api_keys.as_ref())
        .with_custom_provider_name(Some(provider_name.as_str()))
        .resolve();
    match key {
        Ok(_) => serde_json::json!({
            "online": true, "provider": provider_name, "model": model,
            "reason": "api key present",
        }),
        Err(e) => serde_json::json!({
            "online": false, "provider": provider_name, "model": model,
            "reason": format!("no api key: {e:#}"),
        }),
    }
}

/// Bridge: one rig-native tool per MCP provider, built programmatically —
/// no HTTP, no JSON-RPC hop, no config file. Names, descriptions and JSON
/// schemas pass through untouched (no prefixes added); `call` invokes the
/// provider in-process via `McpToolProvider::call`.
pub struct McpBridgeTool {
    provider: std::sync::Arc<dyn zw_core::McpToolProvider>,
}

impl McpBridgeTool {
    pub fn new(provider: std::sync::Arc<dyn zw_core::McpToolProvider>) -> Self {
        Self { provider }
    }
}

impl zerostack::rig::tool::ToolDyn for McpBridgeTool {
    fn name(&self) -> String {
        self.provider.name().to_string()
    }

    fn description(&self) -> String {
        self.provider.description().to_string()
    }

    fn parameters(&self) -> serde_json::Value {
        self.provider.input_schema()
    }

    fn call<'a>(
        &'a self,
        args: String,
    ) -> zerostack::rig::wasm_compat::WasmBoxedFuture<'a,
        Result<String, zerostack::rig::tool::ToolError>,
    > {
        Box::pin(async move {
            use zerostack::rig::tool::ToolError;
            let value: serde_json::Value =
                serde_json::from_str(&args).map_err(ToolError::JsonError)?;
            let out = self
                .provider
                .call(value)
                .await
                .map_err(|e| ToolError::ToolCallError(e.into()))?;
            Ok(out.text)
        })
    }
}

/// Build one factory per provider and hand them to the engine crate. Call
/// once at boot, before the first chat turn — later agent builds pick them
/// up with their original names (`manage_whiteboard`, `inspect`, …).
pub fn register_agent_tools(providers: Vec<std::sync::Arc<dyn zw_core::McpToolProvider>>) {
    let factories: Vec<zerostack::agent::builder::ExtraToolFactory> = providers
        .into_iter()
        .map(|p| {
            let q = p.clone();
            std::sync::Arc::new(move || {
                Box::new(McpBridgeTool::new(q.clone()))
                    as Box<dyn zerostack::rig::tool::ToolDyn>
            }) as zerostack::agent::builder::ExtraToolFactory
        })
        .collect();
    zerostack::agent::builder::set_extra_tool_factories(factories);
}

/// One history row in display shape (mirrors the old transcript endpoint).
#[derive(Debug, Clone, serde::Serialize)]
pub struct HistoryMsg {
    pub role: String,
    pub content: String,
    pub turn_id: String,
}

fn history_msg(
    role: &zerostack::session::MessageRole,
    content: &str,
    turn: &Option<impl ToString>,
) -> Option<HistoryMsg> {
    use zerostack::session::MessageRole;
    let role = match role {
        MessageRole::User => "user",
        MessageRole::Assistant => "assistant",
        // Tool traffic rendered live; history shows text turns only.
        _ => return None,
    }
    .to_string();
    Some(HistoryMsg {
        role,
        content: content.to_string(),
        turn_id: turn.as_ref().map(|t| t.to_string()).unwrap_or_default(),
    })
}

/// History straight from a live engine (its session is the source of truth).
pub fn session_history(engine: &Engine) -> Vec<HistoryMsg> {
    engine
        .session()
        .messages
        .iter()
        .filter_map(|m| history_msg(&m.role, m.content.as_str(), &m.turn))
        .collect()
}

/// Tool steps per turn from the agent's session FILE (durable, read-only).
/// Synthesizes history trace piles for turns that predate trace-row
/// persistence. Never touches a live engine (no locks); completed turns are
/// always flushed to the file by the engine's best-effort saves.
/// Returns turn_id -> ordered tool steps. Thinking is NOT included — the
/// engine never stored reasoning text, so pre-trace piles show tools only.
pub fn load_tool_traces(
    session_id: &str,
) -> std::collections::HashMap<String, Vec<TracedTool>> {
    use zerostack::session::{MessageRole, ToolRecord};
    let mut out: std::collections::HashMap<String, Vec<TracedTool>> =
        std::collections::HashMap::new();
    let s = match zerostack::session::storage::load_session(session_id)
        .ok()
        .flatten()
    {
        Some(s) => s,
        None => return out,
    };
    // (turn, session call id) -> index in that turn's vec, for pairing.
    let mut pending: std::collections::HashMap<(String, u64), usize> =
        std::collections::HashMap::new();
    for m in &s.messages {
        let turn = match m.turn.as_deref().filter(|t| !t.is_empty()) {
            Some(t) => t.to_string(),
            None => continue, // unstamped: unattributable, skip
        };
        match m.role {
            MessageRole::ToolCall => {
                let (cid, name, args) = match &m.tool {
                    Some(ToolRecord::Call { id, name, args }) => (
                        id.to_string(),
                        name.to_string(),
                        args.clone(),
                    ),
                    Some(ToolRecord::SubagentCall { name, args, .. }) => (
                        format!("sub-{}", out.get(&turn).map(|v| v.len()).unwrap_or(0)),
                        name.to_string(),
                        args.clone(),
                    ),
                    _ => (
                        format!("seq-{}", out.get(&turn).map(|v| v.len()).unwrap_or(0)),
                        "action".to_string(),
                        serde_json::Value::Null,
                    ),
                };
                let vec = out.entry(turn.clone()).or_default();
                // Remember numeric session ids for result pairing.
                if let Some(ToolRecord::Call { id, .. }) = &m.tool {
                    pending.insert((turn, *id), vec.len());
                }
                vec.push(TracedTool {
                    call_id: cid,
                    name,
                    args: args.clone(),
                    output: None,
                    note: TurnTrace::tool_note(&args),
                });
            }
            MessageRole::ToolResult => {
                let content = m.content.to_string();
                let mut paired = false;
                if let Some(ToolRecord::Result { call_id, .. }) = &m.tool {
                    if let Some(&idx) = pending.get(&(turn.clone(), *call_id)) {
                        if let Some(tool) = out.get_mut(&turn).and_then(|v| v.get_mut(idx)) {
                            tool.output = Some(content.clone());
                            paired = true;
                        }
                    }
                }
                if !paired {
                    // Sequential fallback: attach to the most recent call in
                    // this turn that still lacks an output.
                    if let Some(vec) = out.get_mut(&turn) {
                        if let Some(tool) = vec.iter_mut().rev().find(|t| t.output.is_none()) {
                            tool.output = Some(content);
                        }
                    }
                }
            }
            _ => {}
        }
    }
    // Drop turns with no tool steps (keeps the map small and truthful).
    out.retain(|_, v| !v.is_empty());
    out
}

/// Build a capped trace-pile JSON from an explicit tool list (used when
/// synthesizing history piles for pre-trace turns). Same schema as
/// [`TurnTrace::to_capped_json`], thinking empty (never stored back then).
pub fn tools_to_trace_json(tools: &[TracedTool]) -> String {
    TurnTrace {
        thinking: String::new(),
        thought_count: 0,
        tools: tools.to_vec(),
    }
    .to_capped_json()
}

/// History from the agent's session file (post-restart, pre-first-message).
/// Returns `None` when this session was never persisted.
pub fn load_session_history(session_id: &str) -> Option<Vec<HistoryMsg>> {
    let s = zerostack::session::storage::load_session(session_id).ok()??;
    Some(
        s.messages
            .iter()
            .filter_map(|m| history_msg(&m.role, m.content.as_str(), &m.turn))
            .collect(),
    )
}

/// Headless engine with server-safe defaults: no TUI, no CWD context scan,
/// provider/model from `Cli::resolve_*` (flags → config → built-in default),
/// API key resolved from env by the provider auth layer.
///
/// Sessions are agent-owned: an existing session file is resumed (keeping its
/// id, adopting the current display name); otherwise a fresh session is built
/// with our id. Disk persistence stays ON (this is the durable transcript).
pub fn new_engine(
    session_id: &str,
    display_name: &str,
    db: zw_db::DbPool,
) -> anyhow::Result<Engine> {
    use zerostack::{cli::Cli, config, context, provider, sandbox, session::Session};

    // YOLO policy (hardcoded, not env-configurable): no permission checker
    // means every tool auto-allows, inside and outside the workspace. The
    // only human gate is the session-bound `ask_user` tool below, which
    // always surfaces in the frontend first.
    let mut cli = Cli {
        no_session: false,
        ..Default::default()
    };
    let (mut cfg, _) = config::load();
    // Env budget overrides (no config.toml edit needed): main-run turns and
    // the subagent per-task budget. Explicit CLI flag / config file still win
    // when set; env only fills the gap. This matters because the embedded
    // engine never parses CLI args, so a clap `env` attribute would not apply.
    if cli.max_agent_turns.is_none() {
        if let Ok(v) = std::env::var("ZS_MAX_AGENT_TURNS") {
            if let Ok(n) = v.trim().parse::<usize>() {
                cli.max_agent_turns = Some(n);
            }
        }
    }
    if cfg.task_max_turns.is_none() {
        if let Ok(v) = std::env::var("ZS_TASK_MAX_TURNS") {
            if let Ok(n) = v.trim().parse::<usize>() {
                cfg.task_max_turns = Some(n);
            }
        }
    }
    let provider_name = cli.resolve_provider(&cfg).to_string();
    let model = cli.resolve_model(&cfg).to_string();
    let quick_models = config::quick_models_map(&cfg);
    let context_window = cfg.resolve_context_window(&provider_name, &model, &quick_models);
    let session = match zerostack::session::storage::load_session(session_id).ok().flatten() {
        Some(mut s) => {
            s.name = display_name.into();
            s
        }
        None => {
            let mut s = Session::new(&provider_name, &model, context_window, display_name);
            s.id = session_id.into();
            s
        }
    };
    let context = context::load_with_prompts_dirs(true, &[]);
    let client = provider::create_client(
        &provider_name,
        cli.api_key.as_deref(),
        &cfg.custom_providers_map(),
        cfg.api_keys.as_ref(),
    )?;
    // Subagent wiring for embedded use: the fork only calls subagents::init
    // in its CLI startup path, so without this the registered `subagent`
    // tool would panic when called. Values mirror startup.rs init_features.
    // Process-global and idempotent (same config every engine), so calling
    // it per engine creation is safe.
    {
        use zerostack::extras::subagents;
        let task_max_turns = cfg.task_max_turns.unwrap_or(20);
        subagents::init(
            client.clone(),
            model.clone(),
            task_max_turns,
            std::sync::Arc::new(cfg.clone()),
            cli.resolve_tools(&cfg),
        );
    }
    // Session-bound ask tool: this engine's turns get their own instance
    // (holds sid + db), attached before first build. Global whiteboard
    // bridges arrive separately via the fork's factory registry.
    let ask_tool: Box<dyn zerostack::rig::tool::ToolDyn> =
        Box::new(McpBridgeTool::new(std::sync::Arc::new(
            ask::AskUserProvider::new(session_id, db),
        )));
    Ok(Engine::new(
        cli,
        cfg,
        session,
        context,
        client,
        None,
        sandbox::Sandbox::new(false, "bwrap"),
    )
    .with_extra_tools(vec![ask_tool]))
}
