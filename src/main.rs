use std::path::PathBuf;
use std::sync::Arc;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with_writer(std::io::stderr)
        .init();

    let args: Vec<String> = std::env::args().collect();
    let mcp_only = args.iter().any(|a| a == "--mcp");

    if mcp_only {
        let cache_dir = std::env::var("ZEROWRAPPER__CACHE_DIR")
            .unwrap_or_else(|_| "./cache".to_string());
        let cache_dir_path = PathBuf::from(&cache_dir);
        let cache = Arc::new(zw_cache::CacheManager::new(&cache_dir_path));

        let db_path = std::env::var("ZEROWRAPPER__DB_PATH").ok();

        // Workspace root: explicit AGENTS_DIR wins, else ZW_WORKDIR (the
        // process cwd the native engine uses as agent session dir), else the
        // actual cwd, else legacy "agents". Set only ZW_WORKDIR.
        let agents_dir = std::env::var("AGENTS_DIR")
            .or_else(|_| std::env::var("ZW_WORKDIR"))
            .unwrap_or_else(|_| {
                std::env::current_dir()
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|_| "agents".into())
            });
        // Single native workspace: the set dir IS the root. (The old
        // `<agent>/workspace` nesting was multi-daemon baggage.)
        let whiteboard_dir = std::path::PathBuf::from(&agents_dir);

        let mcp = zw_mcp::McpRegistry::new();
        if let Some(db_path) = db_path {
            let db = zw_db::DbPool::open(&db_path).await?;
            db.migrate().await?;
            let store = zw_db::SessionStore::new(whiteboard_dir.clone(), db.clone());
            let wb = zw_whiteboard::WhiteboardHandle::new(whiteboard_dir.clone(), cache.clone(), std::time::Duration::from_millis(500)).with_db(store.clone());
            let materials = zw_materials::TemplateStore::new(whiteboard_dir.clone(), db);
            mcp.register_provider(std::sync::Arc::new(
                mcp_web_files_render::WebFilesRenderProvider::new(cache.clone())
            )).await;
            mcp.register_provider(std::sync::Arc::new(
                mcp_web_files_render::GetFilePathProvider::new(cache.clone())
            )).await;
            mcp.register_provider(std::sync::Arc::new(
                zw_mcp::manage_whiteboard::ManageWhiteboardProvider::new(wb)
            )).await;
            mcp.register_provider(std::sync::Arc::new(
                zw_mcp::manage_materials::ManageMaterialsProvider::new(materials)
            )).await;
            mcp.register_provider(std::sync::Arc::new(
                zw_mcp::inspect::InspectProvider::new(store)
            )).await;
        } else {
            let wb = zw_whiteboard::WhiteboardHandle::new(whiteboard_dir, cache.clone(), std::time::Duration::from_millis(500));
            tracing::warn!("ZEROWRAPPER__DB_PATH unset; manage_whiteboard will report 'db not configured'");
            mcp.register_provider(std::sync::Arc::new(
                mcp_web_files_render::WebFilesRenderProvider::new(cache.clone())
            )).await;
            mcp.register_provider(std::sync::Arc::new(
                mcp_web_files_render::GetFilePathProvider::new(cache.clone())
            )).await;
            mcp.register_provider(std::sync::Arc::new(
                zw_mcp::manage_whiteboard::ManageWhiteboardProvider::new(wb)
            )).await;
        }

        tracing::info!("MCP-only mode — cache_dir={}", cache_dir);
        mcp.run_stdio().await?;
        return Ok(());
    }

    let config = zw_core::WrapperConfig::load()?;
    let cache = Arc::new(zw_cache::CacheManager::new(&config.cache_dir));

    let db = zw_db::DbPool::open(&config.db_path).await?;
    db.migrate().await?;
    tracing::info!("Database migrated");

    let whiteboard_dir = config.ch_web.whiteboard_dir.clone().unwrap_or_else(|| {
        let agents_dir = std::env::var("AGENTS_DIR")
            .or_else(|_| std::env::var("ZW_WORKDIR"))
            .unwrap_or_else(|_| {
                std::env::current_dir()
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|_| "agents".into())
            });
        std::path::PathBuf::from(agents_dir)
    });
    tracing::info!("whiteboard dir: {}", whiteboard_dir.display());

    let store = zw_db::SessionStore::new(whiteboard_dir.clone(), db.clone());
    let whiteboard = zw_whiteboard::WhiteboardHandle::new(whiteboard_dir.clone(), cache.clone(), std::time::Duration::from_millis(500)).with_db(store.clone());
    // Boot: create workspace/whiteboard/whiteboard.wb (first empty page)
    // immediately so the agent and the UI always have a file to work with.
    if let Err(e) = whiteboard.ensure("shared").await {
        tracing::warn!("whiteboard boot ensure failed: {}", e);
    }
    let _wb_task = whiteboard.spawn();

    let mcp = zw_mcp::McpRegistry::new();
    // Same provider instances serve MCP transports AND the embedded engine:
    // shared Arcs, original names preserved (no prefixes), no HTTP hop.
    let mut agent_tools: Vec<std::sync::Arc<dyn zw_core::McpToolProvider>> = vec![
        std::sync::Arc::new(mcp_web_files_render::WebFilesRenderProvider::new(cache.clone())),
        std::sync::Arc::new(mcp_web_files_render::GetFilePathProvider::new(cache.clone())),
        std::sync::Arc::new(zw_mcp::manage_whiteboard::ManageWhiteboardProvider::new(whiteboard.clone())),
    ];
    let materials = zw_materials::TemplateStore::new(whiteboard_dir.clone(), db.clone());
    agent_tools.push(std::sync::Arc::new(
        zw_mcp::manage_materials::ManageMaterialsProvider::new(Clone::clone(&materials)),
    ));
    agent_tools.push(std::sync::Arc::new(
        zw_mcp::inspect::InspectProvider::new(store.clone()),
    ));
    for p in &agent_tools {
        mcp.register_provider(p.clone()).await;
    }
    // Bridge into the native engine's toolset (registered before first turn).
    zw_agent_embed::register_agent_tools(agent_tools);

    tracing::info!("Config loaded: native engine, db={}, web_channel={{{}}}",
        config.db_path, config.ch_web.bind);

    // Native engine: no daemon bridge, no channel registry, no watchdog.
    // Chat runs in-process (ws/handler ENGINES); history lives in our DB.
    let primary_bind = config.ch_web.bind.clone();

    // Bare page: no landing/sitesettings YAML is ever loaded — no checkers,
    // no fallback logs. config_dir stays for favicon/robots static files.
    let config_dir = std::env::var("ZEROWRAPPER_CONFIG_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| std::path::PathBuf::from("config"));

    let ui_ctx = ch_web_ui::context::AppContext::new(
        store.clone(),
        cache.clone(),
        config.ch_web.upload_dir.clone(),
        config_dir,
    )
    .with_whiteboard(whiteboard.clone())
    .with_materials(materials)
    .with_mcp(mcp.providers());
    let _webhook_worker = ch_web_ui::webhooks::spawn_webhook_worker(store.clone());
    let _ttl_worker = ch_web_ui::ttl_sweeper::spawn_ttl_sweeper(store.clone(), std::time::Duration::from_secs(30));
    let _scheduler = ch_web_ui::scheduler::spawn_scheduler(store.clone());
    let ui_handle = tokio::spawn(async move {
        if let Err(e) = ch_web_ui::app::start_on(primary_bind, ui_ctx).await {
            tracing::error!("ch-web-ui exited: {}", e);
        }
    });

    tracing::info!("Starting MCP stdio loop");
    mcp.run_stdio().await?;

    let _ = ui_handle.await;

    Ok(())
}
