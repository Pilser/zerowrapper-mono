//! Shared broadcast channel for inspect commands.
//!
//! The `inspect` MCP tool sends commands here; the WS handler forwards them
//! to the connected browser tab. This decouples the MCP transport (HTTP/stdio)
//! from the per-connection WS handler.

use std::sync::LazyLock;
use tokio::sync::broadcast;

/// Maximum number of inspect commands that can be queued.
const INSPECT_CHANNEL_CAPACITY: usize = 64;

/// Global broadcast channel for inspect commands.
///
/// Sender: `inspect` MCP tool (HTTP/stdio).
/// Receiver: WS handler forwards to browser tab.
pub static INSPECT_CMD_TX: LazyLock<broadcast::Sender<serde_json::Value>> =
    LazyLock::new(|| {
        let (tx, _rx) = broadcast::channel(INSPECT_CHANNEL_CAPACITY);
        tx
    });

/// Subscribe to inspect commands. Used by the WS handler.
pub fn subscribe_inspect() -> broadcast::Receiver<serde_json::Value> {
    INSPECT_CMD_TX.subscribe()
}

/// Send an inspect command. Used by the `inspect` MCP tool.
pub fn send_inspect(cmd: serde_json::Value) -> Result<usize, broadcast::error::SendError<serde_json::Value>> {
    INSPECT_CMD_TX.send(cmd)
}
