pub mod protocol;
pub mod dispatch;
pub mod manage_whiteboard;
pub mod manage_materials;
pub mod materials_help;
pub mod srv;
pub mod srv_help;
pub mod inspect;
pub mod inspect_cmd;

use crate::dispatch::McpProviders;

pub struct McpRegistry {
    providers: McpProviders,
}

impl McpRegistry {
    pub fn new() -> Self {
        Self {
            providers: std::sync::Arc::new(tokio::sync::RwLock::new(Vec::new())),
        }
    }

    /// Register a provider (shared `Arc`, so the same instance can also be
    /// bridged into the embedded engine's toolset). Call with `.await`.
    pub async fn register_provider(&self, provider: std::sync::Arc<dyn zw_core::McpToolProvider>) {
        let name = provider.name().to_string();
        tracing::info!("Registering MCP tool provider: {}", name);
        self.providers.write().await.push(provider);
    }

    /// Shared handle to the provider list (used by both stdio and HTTP transports).
    pub fn providers(&self) -> McpProviders {
        self.providers.clone()
    }

    pub async fn run_stdio(self) -> anyhow::Result<()> {
        dispatch::run_stdio_loop(self.providers).await
    }
}

impl Default for McpRegistry {
    fn default() -> Self {
        Self::new()
    }
}