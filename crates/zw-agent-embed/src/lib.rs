//! In-process zerostack engine for zerowrapper ("embedded" backend).
//!
//! Structured stream, end to end: every [`AgentEvent`] maps 1:1 to a typed
//! [`StreamEvent`] — no text scraping, no regex. Call pairing is by typed
//! `call_id`, never by "most recent call". The existing ws buffer task
//! (`buffer_event` + `stream_buffer` resume) consumes these unchanged.

pub mod engine {
    pub use ::zerostack::engine::*;
}

use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

use tokio::sync::mpsc;
use zerostack::engine::{Engine, RunOutput};
use zerostack::event::AgentEvent;
use zw_core::StreamEvent;

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

/// Run one prompt on `engine`, forwarding the live structured stream into the
/// same `event_tx` the ws buffer task already drains (resume/seq unchanged).
///
/// Terminal-event guarantee: exactly one closing event per turn. The tap
/// forwards `Done` on the happy path; if the engine caught the failure
/// internally (`Error` forwarded, transcript returned as `Ok`) or
/// `run_streaming` itself failed, a closing `Done`/`Error` is synthesized
/// here so the frontend always finalizes.
pub async fn run_embedded(
    engine: &mut Engine,
    prompt: &str,
    event_tx: mpsc::Sender<StreamEvent>,
    turn_id: &str,
) -> anyhow::Result<RunOutput> {
    let (agent_tx, mut agent_rx) = mpsc::channel::<AgentEvent>(512);
    let done_seen = Arc::new(AtomicBool::new(false));
    let done_flag = done_seen.clone();
    // Clone: the original stays with us for the synthesized closing event.
    let tx_forward = event_tx.clone();
    let turn_owned = turn_id.to_string();
    let forward = tokio::spawn(async move {
        while let Some(ev) = agent_rx.recv().await {
            if matches!(ev, AgentEvent::Done { .. }) {
                done_flag.store(true, Ordering::Relaxed);
            }
            if let Some(se) = map_event(ev, &turn_owned) {
                if tx_forward.send(se).await.is_err() {
                    break;
                }
            }
        }
    });

    let out = engine
        .run_streaming(prompt, agent_tx, Some(turn_id.to_string()))
        .await;
    // `agent_tx` moved into `run_streaming` and drops on return → the
    // forward task drains the remainder and ends.
    let _ = forward.await;

    match &out {
        Ok(o) => {
            if let Some(u) = &o.usage {
                tracing::info!(
                    kind = ?o.kind,
                    input_tokens = u.input_tokens,
                    output_tokens = u.output_tokens,
                    "embedded turn complete"
                );
            }
            if !done_seen.load(Ordering::Relaxed) {
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
    out
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
pub fn new_engine(session_id: &str, display_name: &str) -> anyhow::Result<Engine> {
    use zerostack::{cli::Cli, config, context, provider, sandbox, session::Session};

    let cli = Cli {
        no_session: false,
        ..Default::default()
    };
    let (cfg, _) = config::load();
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
    Ok(Engine::new(
        cli,
        cfg,
        session,
        context,
        client,
        None,
        sandbox::Sandbox::new(false, "bwrap"),
    ))
}
