use tokio::sync::mpsc;
use zw_core::{ChannelMessage, StreamEvent};
use crate::zeroclaw_bridge::ZeroClawBridge;

pub async fn route_incoming(
    zc: ZeroClawBridge,
    msg: ChannelMessage,
    event_tx: Option<mpsc::Sender<StreamEvent>>,
) -> anyhow::Result<String> {
    // Single-user: trust frontend session_id (sess_xxx). Fallback to legacy
    // composite only when missing/unknown so old clients keep working.
    let session_id = if msg.session_id.is_empty() || msg.session_id == "unknown" {
        build_session_id(&msg.channel, &msg.agent_alias, &msg.user_id, &msg.role)
    } else {
        sanitize_key(&msg.session_id)
    };
    let channel = &msg.channel;
    let result = match event_tx {
        Some(tx) => zc.process_prompt_stream(&session_id, &msg.user_id, &msg.agent_alias, channel, &msg.role, &msg.attachments, &msg.content, tx).await?,
        None => zc.process_prompt(&session_id, &msg.user_id, &msg.agent_alias, channel, &msg.role, &msg.attachments, &msg.content).await?,
    };
    Ok(result)
}

fn sanitize_key(raw: &str) -> String {
    raw.chars()
        .map(|c| if c.is_alphanumeric() || c == '_' || c == '-' || c == '.' || c == '@' { c } else { '_' })
        .collect()
}

pub fn build_session_id(channel: &str, agent_alias: &str, user_id: &str, _role: &str) -> String {
    let key = format!("{}.{}.{}", channel, agent_alias, user_id);
    sanitize_key(&key)
}
