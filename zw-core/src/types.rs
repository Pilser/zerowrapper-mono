use serde::{Deserialize, Serialize};

pub type SessionId = String;
pub type UserId = String;
pub type FileHash = String;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelMessage {
    pub channel: String,
    pub session_id: SessionId,
    pub user_id: UserId,
    pub content: String,
    /// Which zeroclaw agent this message is for
    pub agent_alias: String,
    pub role: String,
    pub attachments: Vec<Attachment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub filename: String,
    pub mime_type: String,
    #[serde(default)]
    pub data: Vec<u8>,
    #[serde(default)]
    pub path: String,
}

/// Events streamed from the ZeroClaw daemon to the WebSocket client during a prompt.
/// Each variant serializes to the JSON format expected by the frontend.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum StreamEvent {
    Thinking { content: String },
    Chunk { content: String },
    ChunkReset,
    ToolCall { tool_call_id: String, name: String, args: serde_json::Value },
    ToolResult { tool_call_id: String, name: String, output: String },
    Done { content: String, turn_id: String },
    Error { message: String },
    /// The native `ask_user` tool needs a human: right drawer opens,
    /// answers go back via REST (never the live socket).
    /// `kind` is "model" for LLM-driven questions, "system-continue" for the
    /// wrapper's own budget-resume prompt (same drawer, distinct header).
    AskRequest {
        ask_id: String,
        session_id: String,
        questions: serde_json::Value,
        kind: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMessagesResult {
    pub session_id: String,
    pub messages: Vec<HistoryEntry>,
    pub total: usize,
    pub start: usize,
}
