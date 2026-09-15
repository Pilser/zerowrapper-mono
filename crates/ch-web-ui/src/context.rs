use std::sync::Arc;

use zw_db::SessionStore;
use zw_db::rate::RateLimiter;
use zw_cache::CacheManager;
#[derive(Clone)]
pub struct AppContext {
    pub db: SessionStore,
    pub cache: Arc<CacheManager>,
    pub rates: Arc<RateLimiter>,
    pub upload_dir: std::path::PathBuf,
    pub config_dir: std::path::PathBuf,
    pub whiteboard: Option<zw_whiteboard::WhiteboardHandle>,
    pub materials: Option<zw_materials::TemplateStore>,
    pub mcp: Option<zw_mcp::dispatch::McpProviders>,
    pub realtime: std::sync::Arc<crate::realtime::Broker>,
}

impl AppContext {
    pub fn new(
        db: SessionStore,
        cache: Arc<CacheManager>,
        upload_dir: std::path::PathBuf,
        config_dir: std::path::PathBuf,
    ) -> Self {
        Self {
            db,
            cache,
            rates: Arc::new(RateLimiter::default()),
            upload_dir,
            config_dir,
            whiteboard: None,
            materials: None,
            mcp: None,
            realtime: std::sync::Arc::new(crate::realtime::Broker::new()),
        }
    }

    pub fn with_whiteboard(mut self, handle: zw_whiteboard::WhiteboardHandle) -> Self {
        self.whiteboard = Some(handle);
        self
    }

    pub fn with_mcp(mut self, providers: zw_mcp::dispatch::McpProviders) -> Self {
        self.mcp = Some(providers);
        self
    }

    pub fn with_materials(mut self, store: zw_materials::TemplateStore) -> Self {
        self.materials = Some(store);
        self
    }

    pub fn whiteboard(&self) -> Option<&zw_whiteboard::WhiteboardHandle> {
        self.whiteboard.as_ref()
    }

    pub fn materials(&self) -> Option<&zw_materials::TemplateStore> {
        self.materials.as_ref()
    }
}
