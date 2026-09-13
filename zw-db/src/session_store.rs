use crate::hook_deliveries::SrvDelivery;
use crate::keys::SrvApiKey;
use crate::whiteboard::PublicSnap;
use crate::DbPool;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use turso::params::Params;
use turso::Value;

#[derive(Clone)]
pub struct SessionStore {
    system: DbPool,
    root: Arc<PathBuf>,
    open: Arc<Mutex<HashMap<String, Arc<DbPool>>>>,
}

/// Shared serverless layout.
///
/// There is exactly one serverless database per agent workspace:
/// `<workspace>/whiteboard/serverless.db`. Every chat session reads and writes
/// the same file, so switching sessions never orphans boards, records, or the
/// whiteboard — rows inside stay keyed by `session_id`, but the file is shared.
/// Legacy per-session files (`sessions/<sid>/<sid>.db`) are imported once on
/// first open (newest wins) and then left untouched.
pub const SHARED_DB_FILE: &str = "serverless.db";
const SHARED_KEY: &str = "shared";

impl SessionStore {
    pub fn new(root: PathBuf, system: DbPool) -> Self {
        Self {
            system,
            root: Arc::new(root),
            open: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn system(&self) -> &DbPool {
        &self.system
    }

    fn shared_path(&self) -> PathBuf {
        self.root.join("whiteboard").join(SHARED_DB_FILE)
    }

    /// Legacy per-session database files from before the shared layout.
    fn legacy_candidates(&self) -> Vec<PathBuf> {
        let sessions = self.root.join("sessions");
        let entries = match std::fs::read_dir(&sessions) {
            Ok(e) => e,
            Err(_) => return Vec::new(),
        };
        let mut out = Vec::new();
        for entry in entries.flatten() {
            let dir = entry.path();
            if !dir.is_dir() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().into_owned();
            let db = dir.join(format!("{name}.db"));
            if db.is_file() {
                out.push(db);
            }
        }
        // Newest first so a single copy picks up the freshest data.
        out.sort_by_key(|p| {
            std::fs::metadata(p)
                .and_then(|m| m.modified())
                .ok()
        });
        out.reverse();
        out
    }

    /// One-time migration: if the shared DB does not exist yet but legacy
    /// per-session DBs do, copy the newest one (plus its WAL/SHM sidecars so
    /// uncheckpointed pages survive) into the shared location.
    fn import_legacy_once(&self) {
        let shared = self.shared_path();
        if shared.exists() {
            return;
        }
        let candidates = self.legacy_candidates();
        let Some(newest) = candidates.first() else {
            return;
        };
        if let Some(parent) = shared.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if std::fs::copy(newest, &shared).is_ok() {
            // Copy WAL/SHM sidecars when present so uncheckpointed data survives.
            // For `<sid>.db` the sidecars are `<sid>.db-wal` / `<sid>.db-shm`.
            for suffix in ["-wal", "-shm"] {
                let src = format!("{}{}", newest.display(), suffix);
                let dst = format!("{}{}", shared.display(), suffix);
                let _ = std::fs::copy(&src, &dst);
            }
            tracing::info!(
                "serverless store: migrated {} -> {}",
                newest.display(),
                shared.display()
            );
            if candidates.len() > 1 {
                tracing::warn!(
                    "serverless store: {} legacy session DBs found; only the newest was imported, the rest stay in sessions/",
                    candidates.len()
                );
            }
        }
    }

    pub async fn session(&self, _sid: &str) -> anyhow::Result<Arc<DbPool>> {
        let mut open = self.open.lock().await;
        if let Some(pool) = open.get(SHARED_KEY) {
            return Ok(pool.clone());
        }
        self.import_legacy_once();
        let path = self.shared_path().to_str().unwrap().to_string();
        let pool = Arc::new(DbPool::open(&path).await?);
        pool.migrate_session().await?;
        open.insert(SHARED_KEY.to_string(), pool.clone());
        Ok(pool)
    }

    pub async fn discard(&self, _sid: &str) {
        self.open.lock().await.remove(SHARED_KEY);
    }

    pub async fn session_id_for_board(&self, board_id: &str) -> anyhow::Result<String> {
        let conn = self.system.conn().await;
        let mut rows = conn
            .query(
                "SELECT session_id FROM srv_board_index WHERE board_id = ?1",
                Params::Positional(vec![Value::from(board_id)]),
            )
            .await?;
        match rows.next().await? {
            Some(row) => match row.get_value(0)? {
                Value::Text(s) => Ok(s),
                _ => Err(anyhow::anyhow!("invalid session_id in srv_board_index")),
            },
            None => anyhow::bail!("board {board_id} not found"),
        }
    }

    pub async fn board_pool(&self, board_id: &str) -> anyhow::Result<Arc<DbPool>> {
        // inspect-reports board: auto-create on first use (shared, whiteboard/serverless.db via SHARED_KEY)
        if board_id == "inspect-reports" {
            if let Ok(pool) = self.session(SHARED_KEY).await {
                if pool.srv_app_by_id(board_id).await.unwrap_or(None).is_none() {
                    let _ = pool.srv_app_create_with_id(board_id, SHARED_KEY, "inspect-reports", None, true, None).await;
                    let _ = self.register_board(SHARED_KEY, board_id, SHARED_KEY).await;
                }
            }
        }
        // The board index is still consulted so unknown boards keep 404ing;
        // the data itself always lives in the single shared database.
        let _ = self.session_id_for_board(board_id).await?;
        self.session(SHARED_KEY).await
    }

    pub async fn register_board(&self, sid: &str, board_id: &str, owner_key: &str) -> anyhow::Result<()> {
        let conn = self.system.conn().await;
        conn.execute(
            "INSERT INTO srv_board_index (board_id, session_id, owner_key) VALUES (?1, ?2, ?3)",
            Params::Positional(vec![Value::from(board_id), Value::from(sid), Value::from(owner_key)]),
        )
        .await?;
        Ok(())
    }

    pub async fn unregister_board(&self, board_id: &str) -> anyhow::Result<()> {
        let conn = self.system.conn().await;
        conn.execute(
            "DELETE FROM srv_board_index WHERE board_id = ?1",
            Params::Positional(vec![Value::from(board_id)]),
        )
        .await?;
        Ok(())
    }

    pub async fn all_session_ids(&self) -> anyhow::Result<Vec<String>> {
        // Shared layout: distinct session_ids that actually have rows in the
        // shared DB, plus any legacy on-disk session dirs (pre-migration).
        let mut out = Vec::new();
        if let Ok(pool) = self.session(SHARED_KEY).await {
            let conn = pool.conn().await;
            if let Ok(mut rows) = conn
                .query(
                    "SELECT DISTINCT session_id FROM whiteboard_meta",
                    turso::params::Params::None,
                )
                .await
            {
                while let Ok(Some(row)) = rows.next().await {
                    if let Ok(turso::Value::Text(s)) = row.get_value(0) {
                        out.push(s);
                    }
                }
            }
        }
        let dir = self.root.join("sessions");
        if let Ok(entries) = std::fs::read_dir(&dir) {
            for entry in entries.flatten() {
                if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                    let name = entry.file_name().to_string_lossy().into_owned();
                    if !out.contains(&name) {
                        out.push(name);
                    }
                }
            }
        }
        out.sort();
        Ok(out)
    }

    async fn ensure_board_owned(&self, _board_id: &str, _owner: &str) -> anyhow::Result<()> {
        // Shared board — no per-session ownership. Keep compat, always ok.
        Ok(())
    }

    pub async fn create_board(
        &self,
        sid: &str,
        title: &str,
        schema_json: Option<&str>,
        public_reads: bool,
        unique_key: Option<&str>,
    ) -> anyhow::Result<String> {
        let _ = sid; // shared — ignore caller sid, keep compat
        let pool = self.session(SHARED_KEY).await?;
        let board_id = pool.srv_app_create(SHARED_KEY, title, schema_json, public_reads, unique_key).await?;
        self.register_board(SHARED_KEY, &board_id, SHARED_KEY).await?;
        Ok(board_id)
    }

    pub async fn delete_board(&self, sid: &str, board_id: &str) -> anyhow::Result<()> {
        let _ = sid;
        let pool = self.session(SHARED_KEY).await?;
        pool.srv_app_delete(board_id, SHARED_KEY).await?;
        self.unregister_board(board_id).await?;
        Ok(())
    }

    pub async fn key_issue(&self, board_id: &str, owner: &str, role: &str, writer: Option<&str>, scope: Option<&str>) -> anyhow::Result<(String, String)> {
        self.ensure_board_owned(board_id, owner).await?;
        self.system.srv_key_issue(board_id, owner, role, writer, scope).await
    }

    pub async fn key_list(&self, board_id: &str, owner: &str) -> anyhow::Result<Vec<SrvApiKey>> {
        self.ensure_board_owned(board_id, owner).await?;
        self.system.srv_key_list(board_id, owner).await
    }

    pub async fn key_revoke(&self, board_id: &str, owner: &str, bucket: &str) -> anyhow::Result<bool> {
        self.ensure_board_owned(board_id, owner).await?;
        self.system.srv_key_revoke(board_id, owner, bucket).await
    }

    pub async fn set_page_public(&self, sid: &str, page_no: i64, public: bool) -> anyhow::Result<Option<String>> {
        let _ = sid;
        let pool = self.session(SHARED_KEY).await?;
        let slug = pool.wb_set_public(SHARED_KEY, page_no, public).await?;
        let conn = self.system.conn().await;
        match &slug {
            Some(slug) => {
                conn.execute(
                    "INSERT OR REPLACE INTO wb_public_index (slug, session_id, page_no) VALUES (?1, ?2, ?3)",
                    Params::Positional(vec![Value::from(slug.clone()), Value::from(SHARED_KEY), Value::Integer(page_no)]),
                )
                .await?;
            }
            None => {
                conn.execute(
                    "DELETE FROM wb_public_index WHERE session_id = ?1 AND page_no = ?2",
                    Params::Positional(vec![Value::from(SHARED_KEY), Value::Integer(page_no)]),
                )
                .await?;
            }
        }
        Ok(slug)
    }

    pub async fn public_snapshot(&self, slug: &str) -> anyhow::Result<Option<PublicSnap>> {
        let sid = {
            let conn = self.system.conn().await;
            let mut rows = conn
                .query(
                    "SELECT session_id FROM wb_public_index WHERE slug = ?1",
                    Params::Positional(vec![Value::from(slug)]),
                )
                .await?;
            match rows.next().await? {
                Some(row) => match row.get_value(0)? {
                    Value::Text(s) => s,
                    _ => return Err(anyhow::anyhow!("invalid session_id in wb_public_index")),
                },
                None => return Ok(None),
            }
        };
        let _ = sid; // shared — ignore, always use shared pool
        let pool = self.session(SHARED_KEY).await?;
        pool.wb_public_snapshot(slug).await
    }

    pub async fn delete_public_by_page(&self, sid: &str, page_no: i64) -> anyhow::Result<()> {
        let _ = sid;
        let pool = self.session(SHARED_KEY).await?;
        pool.wb_delete_public_by_page(SHARED_KEY, page_no).await?;
        let conn = self.system.conn().await;
        conn.execute(
            "DELETE FROM wb_public_index WHERE session_id = ?1 AND page_no = ?2",
            Params::Positional(vec![Value::from(SHARED_KEY), Value::Integer(page_no)]),
        )
        .await?;
        Ok(())
    }

    pub async fn hook_urls(&self, board_id: &str) -> anyhow::Result<Vec<(String, Option<String>)>> {
        let pool = self.board_pool(board_id).await?;
        pool.srv_hook_urls(board_id).await
    }

    pub async fn hook_enqueue(&self, board_id: &str, url: &str, event: &str) -> anyhow::Result<i64> {
        self.system.srv_hook_enqueue(board_id, url, event).await
    }

    pub async fn hook_reschedule(&self, board_id: &str, owner: &str, url: &str) -> anyhow::Result<i64> {
        self.ensure_board_owned(board_id, owner).await?;
        self.system.srv_hook_reschedule(board_id, owner, url).await
    }

    pub async fn hook_deliveries(&self, board_id: &str, owner: &str, url: Option<&str>) -> anyhow::Result<Vec<SrvDelivery>> {
        self.ensure_board_owned(board_id, owner).await?;
        self.system.srv_hook_deliveries(board_id, owner, url).await
    }

    pub async fn ttl_sweep_all(&self) -> anyhow::Result<u64> {
        // Single shared database: one sweep covers every session.
        let pool = self.session(SHARED_KEY).await?;
        Ok(pool.srv_ttl_sweep().await?)
    }
}
