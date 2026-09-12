pub mod monitor;
pub mod parser;
pub mod resolve;

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::broadcast;
use tokio::sync::Mutex;

use crate::monitor::MonitorCore;

#[derive(Debug, Clone, serde::Serialize)]
pub struct Pin {
    pub name: String,
    pub url: String,
    pub mime: String,
    pub size: u64,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ParsedBoard {
    pub body_md: String,
    pub pins: Vec<Pin>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct BoardPage {
    pub page_no: i64,
    pub title: String,
    pub body_md: String,
    pub public: bool,
    pub public_slug: Option<String>,
    pub pins: Vec<Pin>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct BoardState {
    pub session_id: String,
    pub pages: Vec<BoardPage>,
    pub active_page: Option<i64>,
    pub locked: bool,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WhiteboardEvent {
    WhiteboardUpdate {
        session_id: String,
        board: ParsedBoard,
    },
    BoardUpdate {
        session_id: String,
        state: BoardState,
    },
}

const SEED_TEMPLATE: &str = "# Whiteboard\n";

/// Shared board layout: a single `<workspace>/whiteboard/whiteboard.wb` file
/// and a single shared database board (`SHARED_SID`) serve every chat session,
/// so switching sessions never resets the board or orphans serverless apps.
/// The caller's `sid` is still used for in-memory tracking keys and echoed in
/// events, so per-connection forwarding keeps working unchanged.
pub const SHARED_SID: &str = "shared";
pub const WHITEBOARD_FILE: &str = "whiteboard.wb";

#[derive(Clone)]
pub struct WhiteboardHandle {
    dir: PathBuf,
    cache: Arc<zw_cache::CacheManager>,
    poll_interval: Duration,
    state: Arc<Mutex<MonitorCore>>,
    tx: broadcast::Sender<WhiteboardEvent>,
    db: Option<zw_db::session_store::SessionStore>,
}

impl WhiteboardHandle {
    pub fn new(
        dir: PathBuf,
        cache: Arc<zw_cache::CacheManager>,
        poll_interval: Duration,
    ) -> Self {
        std::fs::create_dir_all(&dir).ok();
        let (tx, _) = broadcast::channel(64);
        Self {
            dir,
            cache,
            poll_interval,
            state: Arc::new(Mutex::new(MonitorCore::default())),
            tx,
            db: None,
        }
    }

    pub fn with_db(mut self, db: zw_db::session_store::SessionStore) -> Self {
        self.db = Some(db);
        self
    }

    pub fn spawn(&self) -> tokio::task::JoinHandle<()> {
        let dir = self.dir.clone();
        let cache = self.cache.clone();
        let poll_interval = self.poll_interval;
        let state = self.state.clone();
        let tx = self.tx.clone();
        let db = self.db.clone();
        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(poll_interval);
            loop {
                ticker.tick().await;
                let sessions: Vec<String> = {
                    let core = state.lock().await;
                    core.seen.keys().cloned().collect()
                };
                for sid in sessions {
                    if let Some(store) = &db {
                        poll_with_db(store, &dir, &cache, &state, &tx, &sid).await;
                    } else {
                        poll_without_db(&dir, &cache, &state, &tx, &sid).await;
                    }
                }
            }
        })
    }

    pub async fn list(&self, sid: &str) -> anyhow::Result<BoardState> {
        self.build_state(sid).await
    }

    pub async fn open(&self, sid: &str, page_no: i64) -> anyhow::Result<()> {
        let store = self.db.as_ref().ok_or_else(|| anyhow::anyhow!("whiteboard db not configured"))?;
        let pool = store.session(SHARED_SID).await?;
        pool.wb_ensure_session(SHARED_SID).await?;
        pool.wb_open(SHARED_SID, page_no).await?;
        let (pages, _) = pool.wb_state(SHARED_SID).await?;
        let body = pages
            .iter()
            .find(|p| p.page_no == page_no)
            .map(|p| p.body_md.clone())
            .unwrap_or_default();
        let path = session_path(&self.dir, sid);
        std::fs::write(&path, &body)?;
        set_world_writable(&path);
        let snapshot = {
            let core = self.state.lock().await;
            core.snapshot(&path)
        };
        let mut core = self.state.lock().await;
        core.seen.insert(sid.to_string(), snapshot);
        Ok(())
    }

    pub async fn close(&self, sid: &str) -> anyhow::Result<()> {
        let store = self.db.as_ref().ok_or_else(|| anyhow::anyhow!("whiteboard db not configured"))?;
        let pool = store.session(SHARED_SID).await?;
        let (pages, meta) = pool.wb_state(SHARED_SID).await?;
        pool.wb_close(SHARED_SID).await?;
        // Flush the active page's file content to DB on close so an edit is never
        // lost if the next poll/process doesn't run (e.g. a restart right after close).
        if let Some(active) = meta.active_page {
            if let Ok(raw) = std::fs::read_to_string(session_path(&self.dir, sid)) {
                let title = pages
                    .iter()
                    .find(|p| p.page_no == active)
                    .map(|p| p.title.clone())
                    .unwrap_or_default();
                let _ = pool.wb_write_page(SHARED_SID, active, &title, &raw).await;
                // Bug A: a page that is already public must be re-snapshotted on close,
                // otherwise /w/<slug> keeps serving the stale pre-edit snapshot forever.
                if let Ok(Some(slug)) = pool.wb_public_slug(SHARED_SID, active).await {
                    let pins = pool
                        .wb_public_snapshot(&slug)
                        .await
                        .ok()
                        .flatten()
                        .map(|s| s.pins)
                        .unwrap_or_else(|| "[]".to_string());
                    let _ = pool.wb_set_public_content(&slug, &raw, &pins).await;
                }
            }
        }
        let path = session_path(&self.dir, sid);
        let snapshot = {
            let core = self.state.lock().await;
            core.snapshot(&path)
        };
        let mut core = self.state.lock().await;
        core.seen.insert(sid.to_string(), snapshot);
        Ok(())
    }

    pub async fn add(&self, sid: &str, title: &str) -> anyhow::Result<i64> {
        let _ = sid; // shared board: every session maps to SHARED_SID
        let store = self.db.as_ref().ok_or_else(|| anyhow::anyhow!("whiteboard db not configured"))?;
        let pool = store.session(SHARED_SID).await?;
        pool.wb_add_page(SHARED_SID, title).await
    }

    pub async fn delete(&self, sid: &str, page_no: i64) -> anyhow::Result<()> {
        let _ = sid; // shared board: every session maps to SHARED_SID
        let store = self.db.as_ref().ok_or_else(|| anyhow::anyhow!("whiteboard db not configured"))?;
        let pool = store.session(SHARED_SID).await?;
        pool.wb_delete_page(SHARED_SID, page_no).await
    }

    pub async fn move_pages(&self, sid: &str, from: i64, to: i64) -> anyhow::Result<()> {
        let _ = sid; // shared board: every session maps to SHARED_SID
        let store = self.db.as_ref().ok_or_else(|| anyhow::anyhow!("whiteboard db not configured"))?;
        let pool = store.session(SHARED_SID).await?;
        pool.wb_move_page(SHARED_SID, from, to).await
    }

    pub async fn set_public(&self, sid: &str, page_no: i64, public: bool) -> anyhow::Result<Option<String>> {
        let store = self.db.as_ref().ok_or_else(|| anyhow::anyhow!("whiteboard db not configured"))?;
        let slug = store.set_page_public(SHARED_SID, page_no, public).await?;
        if let Some(slug) = &slug {
            let state = self.build_state(sid).await?;
            if let Some(page) = state.pages.iter().find(|p| p.page_no == page_no) {
                let pool = store.session(SHARED_SID).await?;
                pool.wb_set_public_content(slug, &page.body_md, &serde_json::to_string(&page.pins)?).await?;
            }
        }
        Ok(slug)
    }

    pub async fn ensure(&self, session_id: &str) -> anyhow::Result<()> {
        let path = session_path(&self.dir, session_id);
        if let Some(store) = &self.db {
            let pool = store.session(SHARED_SID).await?;
            let pre = pool.wb_state(SHARED_SID).await.map(|(p, _)| p).unwrap_or_default();
            pool.wb_ensure_session(SHARED_SID).await?;
            let just_seeded = pre.is_empty();
            let (pages, _) = pool.wb_state(SHARED_SID).await?;
            if just_seeded {
                if let Ok(raw) = std::fs::read_to_string(&path) {
                    if !raw.trim().is_empty() && raw.trim() != SEED_TEMPLATE.trim() {
                        let _ = pool.wb_write_page(SHARED_SID, 1, "# Whiteboard", &raw).await;
                    }
                }
            }
            let body = pages
                .iter()
                .find(|p| p.page_no == 1)
                .map(|p| p.body_md.clone())
                .unwrap_or_else(|| SEED_TEMPLATE.to_string());
            if !path.exists() {
                std::fs::write(&path, &body)?;
                set_world_writable(&path);
            } else {
                set_world_writable(&path);
            }
            let snapshot = {
                let core = self.state.lock().await;
                core.snapshot(&path)
            };
            let mut core = self.state.lock().await;
            core.seen.insert(session_id.to_string(), snapshot);
            Ok(())
        } else {
            if !path.exists() {
                std::fs::write(&path, SEED_TEMPLATE)?;
                set_world_writable(&path);
            }
            set_world_writable(&path);
            let board = read_board_from(&self.dir, &self.cache, session_id).unwrap_or_else(|| ParsedBoard {
                body_md: String::new(),
                pins: Vec::new(),
            });
            let snapshot = {
                let core = self.state.lock().await;
                core.snapshot(&path)
            };
            let mut core = self.state.lock().await;
            core.seen.insert(session_id.to_string(), snapshot);
            core.latest.insert(session_id.to_string(), board);
            Ok(())
        }
    }

    pub async fn latest(&self, session_id: &str) -> Option<ParsedBoard> {
        self.state.lock().await.latest.get(session_id).cloned()
    }

    pub async fn latest_state(&self, session_id: &str) -> Option<BoardState> {
        if self.db.is_none() {
            return None;
        }
        self.ensure(session_id).await.ok()?;
        self.build_state(session_id).await.ok()
    }

    pub fn subscribe(&self) -> broadcast::Receiver<WhiteboardEvent> {
        self.tx.subscribe()
    }

    pub fn dir(&self) -> &PathBuf {
        &self.dir
    }

    pub fn db(&self) -> Option<zw_db::session_store::SessionStore> {
        self.db.clone()
    }

    async fn build_state(&self, sid: &str) -> anyhow::Result<BoardState> {
        let store = self.db.as_ref().ok_or_else(|| anyhow::anyhow!("whiteboard db not configured"))?;
        build_board_state(store, &self.dir, &self.cache, sid).await
    }
}

async fn build_board_state(
    store: &zw_db::session_store::SessionStore,
    dir: &Path,
    cache: &Arc<zw_cache::CacheManager>,
    sid: &str,
) -> anyhow::Result<BoardState> {
    let pool = store.session(SHARED_SID).await?;
    let (pages, meta) = pool.wb_state(SHARED_SID).await?;
    let mut state_pages = Vec::new();
    for page in &pages {
        let parsed = parser::parse_markdown(&page.body_md);
        let board = resolve::resolve_board(dir, &parsed, cache)?;
        let public_slug = pool.wb_public_slug(SHARED_SID, page.page_no).await?;
        state_pages.push(BoardPage {
            page_no: page.page_no,
            title: page.title.clone(),
            body_md: board.body_md,
            public: page.public,
            public_slug,
            pins: board.pins,
        });
    }
    Ok(BoardState {
        session_id: sid.to_string(),
        pages: state_pages,
        active_page: meta.active_page,
        locked: meta.locked,
    })
}

async fn poll_with_db(
    store: &zw_db::session_store::SessionStore,
    dir: &Path,
    cache: &Arc<zw_cache::CacheManager>,
    state: &Arc<Mutex<MonitorCore>>,
    tx: &broadcast::Sender<WhiteboardEvent>,
    sid: &str,
) {
    let path = session_path(dir, sid);
    let file_changed = {
        let mut core = state.lock().await;
        core.has_changed(sid, &path)
    };
    if file_changed {
        if let Ok(pool) = store.session(SHARED_SID).await {
            if let Ok((pages, meta)) = pool.wb_state(SHARED_SID).await {
                if let Some(active) = meta.active_page {
                    if let Ok(raw) = std::fs::read_to_string(&path) {
                        let title = pages
                            .iter()
                            .find(|p| p.page_no == active)
                            .map(|p| p.title.as_str())
                            .unwrap_or_default();
                        let _ = pool.wb_write_page(SHARED_SID, active, title, &raw).await;
                    }
                }
            }
        }
    }
    let rev_changed = {
        let mut core = state.lock().await;
        match store.session(SHARED_SID).await {
            Ok(pool) => match pool.wb_state(SHARED_SID).await {
                Ok((pages, meta)) => {
                    let changed = core.rev.get(sid) != Some(&meta.rev);
                    if changed {
                        core.rev.insert(sid.to_string(), meta.rev);
                        // DB -> file: keep the .wb mirror current when the agent isn't
                        // actively editing it (page closed), so the file never resists DB changes.
                        if !meta.locked {
                            if let Some(active) = meta.active_page {
                                if let Some(page) = pages.iter().find(|p| p.page_no == active) {
                                    let path = session_path(dir, sid);
                                    if std::fs::write(&path, &page.body_md).is_ok() {
                                        set_world_writable(&path);
                                        let snap = core.snapshot(&path);
                                        core.seen.insert(sid.to_string(), snap);
                                    }
                                }
                            }
                        }
                    }
                    changed
                }
                Err(_) => false,
            },
            Err(_) => false,
        }
    };
    if rev_changed {
        match build_board_state(store, dir, cache, sid).await {
            Ok(state_val) => {
                let _ = tx.send(WhiteboardEvent::BoardUpdate { session_id: sid.to_string(), state: state_val });
            }
            Err(e) => tracing::warn!("whiteboard state build failed: {}", e),
        }
    }
}

async fn poll_without_db(
    dir: &Path,
    cache: &Arc<zw_cache::CacheManager>,
    state: &Arc<Mutex<MonitorCore>>,
    tx: &broadcast::Sender<WhiteboardEvent>,
    sid: &str,
) {
    let path = session_path(dir, sid);
    let changed = {
        let mut core = state.lock().await;
        core.has_changed(sid, &path)
    };
    if changed {
        if let Some(board) = read_board_from(dir, cache, sid) {
            let mut core = state.lock().await;
            core.latest.insert(sid.to_string(), board.clone());
            let _ = tx.send(WhiteboardEvent::WhiteboardUpdate {
                session_id: sid.to_string(),
                board,
            });
        }
    }
}

fn read_board_from(dir: &Path, cache: &Arc<zw_cache::CacheManager>, session_id: &str) -> Option<ParsedBoard> {
    let path = session_path(dir, session_id);
    if !path.exists() {
        return None;
    }
    let raw = std::fs::read_to_string(&path).ok()?;
    let parsed = parser::parse_markdown(&raw);
    let board = resolve::resolve_board(dir, &parsed, cache).ok()?;
    Some(board)
}

fn set_world_writable(path: &std::path::Path) {
    use std::os::unix::fs::PermissionsExt;
    let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o666));
}

fn session_path(dir: &Path, _sid: &str) -> PathBuf {
    // Shared layout: one `<workspace>/whiteboard/whiteboard.wb` for every
    // session. The sid is ignored so session switches keep the same file.
    let wb_dir = dir.join("whiteboard");
    let path = wb_dir.join(WHITEBOARD_FILE);
    let _ = std::fs::create_dir_all(&wb_dir);
    if !path.exists() {
        // One-time migration from legacy locations (newest wins):
        // - dir/sessions/<sid>/whiteboard.wb (sessions layout)
        // - dir/sessions/<sid>/<sid>.wb (old per-session filename)
        // - dir/<sid>.wb (pre-sessions layout)
        let mut legacy: Vec<PathBuf> = Vec::new();
        if let Ok(entries) = std::fs::read_dir(dir.join("sessions")) {
            for entry in entries.flatten() {
                let sdir = entry.path();
                if !sdir.is_dir() {
                    continue;
                }
                let name = entry.file_name().to_string_lossy().into_owned();
                for cand in [sdir.join("whiteboard.wb"), sdir.join(format!("{name}.wb"))] {
                    if cand.is_file() {
                        legacy.push(cand);
                    }
                }
            }
        }
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("wb") {
                    legacy.push(p);
                }
            }
        }
        legacy.sort_by_key(|p| std::fs::metadata(p).and_then(|m| m.modified()).ok());
        if let Some(newest) = legacy.last() {
            let _ = std::fs::copy(newest, &path);
        }
    }
    path
}