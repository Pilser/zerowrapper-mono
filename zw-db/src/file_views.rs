use crate::DbPool;
use turso::params::Params;
use turso::Value;

#[derive(Debug, Clone)]
pub struct FileViewRow {
    pub id: String,
    pub original_path: String,
}

impl DbPool {
    pub async fn file_view_get_or_create(&self, original_path: &str) -> anyhow::Result<String> {
        let conn = self.conn().await;
        // Try existing
        let mut rows = conn
            .query(
                "SELECT id FROM file_views WHERE original_path = ?1",
                Params::Positional(vec![Value::from(original_path)]),
            )
            .await?;
        if let Some(row) = rows.next().await? {
            if let Ok(Value::Text(id)) = row.get_value(0) {
                return Ok(id);
            }
        }
        // Create new stable id (nanoid-like 11 chars base64)
        let id = nanoid_id();
        conn.execute(
            "INSERT OR IGNORE INTO file_views (id, original_path) VALUES (?1, ?2)",
            Params::Positional(vec![Value::from(id.clone()), Value::from(original_path)]),
        )
        .await?;
        // If raced, fetch again
        let mut rows = conn
            .query(
                "SELECT id FROM file_views WHERE original_path = ?1",
                Params::Positional(vec![Value::from(original_path)]),
            )
            .await?;
        if let Some(row) = rows.next().await? {
            if let Ok(Value::Text(id)) = row.get_value(0) {
                return Ok(id);
            }
        }
        Ok(id)
    }

    pub async fn file_view_resolve_by_path(&self, original_path: &str) -> anyhow::Result<Option<String>> {
        let conn = self.conn().await;
        let mut rows = conn
            .query(
                "SELECT id FROM file_views WHERE original_path = ?1",
                Params::Positional(vec![Value::from(original_path)]),
            )
            .await?;
        if let Some(row) = rows.next().await? {
            if let Ok(Value::Text(id)) = row.get_value(0) {
                return Ok(Some(id));
            }
        }
        Ok(None)
    }

    pub async fn file_view_resolve(&self, id: &str) -> anyhow::Result<Option<String>> {
        let conn = self.conn().await;
        let mut rows = conn
            .query(
                "SELECT original_path FROM file_views WHERE id = ?1",
                Params::Positional(vec![Value::from(id)]),
            )
            .await?;
        if let Some(row) = rows.next().await? {
            if let Ok(Value::Text(p)) = row.get_value(0) {
                return Ok(Some(p));
            }
        }
        Ok(None)
    }

    pub async fn open_file_add(&self, session_id: &str, file_id: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "INSERT OR REPLACE INTO open_files (session_id, file_id, opened_at) VALUES (?1, ?2, datetime('now'))",
            Params::Positional(vec![Value::from(session_id), Value::from(file_id)]),
        )
        .await?;
        Ok(())
    }

    pub async fn open_file_remove(&self, session_id: &str, file_id: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "DELETE FROM open_files WHERE session_id = ?1 AND file_id = ?2",
            Params::Positional(vec![Value::from(session_id), Value::from(file_id)]),
        )
        .await?;
        Ok(())
    }

    pub async fn open_files_list(&self, session_id: &str) -> anyhow::Result<Vec<FileViewRow>> {
        let conn = self.conn().await;
        let mut rows = conn
            .query(
                "SELECT fv.id, fv.original_path FROM file_views fv JOIN open_files o ON o.file_id = fv.id WHERE o.session_id = ?1 ORDER BY o.opened_at DESC",
                Params::Positional(vec![Value::from(session_id)]),
            )
            .await?;
        let mut out = Vec::new();
        while let Some(row) = rows.next().await? {
            let id = match row.get_value(0) {
                Ok(Value::Text(s)) => s,
                _ => continue,
            };
            let path = match row.get_value(1) {
                Ok(Value::Text(s)) => s,
                _ => continue,
            };
            out.push(FileViewRow { id, original_path: path });
        }
        Ok(out)
    }
}

fn nanoid_id() -> String {
    use rand::Rng;
    const ALPHABET: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";
    let mut rng = rand::thread_rng();
    let mut s = String::with_capacity(11);
    for _ in 0..11 {
        let idx = rng.gen_range(0..ALPHABET.len());
        s.push(ALPHABET[idx] as char);
    }
    s
}
