use crate::DbPool;
use turso::params::Params;
use turso::Value;

#[derive(Debug, Clone, serde::Serialize)]
pub struct ChatRow {
    pub id: i64,
    pub role: String,
    pub content: String,
    pub turn_id: String,
    pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct SessionRow {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub last_active: String,
}

pub fn new_simple_id() -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    // sess_<base36 nanos> — simple, no user/role/channel composite
    const CHARS: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let mut s = String::from("sess_");
    let mut n = nanos;
    for _ in 0..10 {
        s.push(CHARS[(n % 36) as usize] as char);
        n /= 36;
        if n == 0 {
            break;
        }
    }
    s
}

impl DbPool {
    pub async fn upsert_session(&self, id: &str) -> anyhow::Result<()> {
        // Single-user thread registry: id + title only. No users, no
        // channels, no agent routing — kept compiling for legacy callers.
        let conn = self.conn().await;
        conn.execute(
            "INSERT OR IGNORE INTO sessions (id, title) VALUES (?1, ?2)",
            Params::Positional(vec![Value::from(id), Value::from(id)]),
        )
        .await?;
        Ok(())
    }

    /// Create a simple single-user thread session: sess_xxx + title.
    pub async fn create_simple_session(&self, id: &str, title: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "INSERT OR IGNORE INTO sessions (id, title) VALUES (?1, ?2)",
            Params::Positional(vec![Value::from(id), Value::from(title)]),
        )
        .await?;
        Ok(())
    }

    pub async fn list_sessions(&self, limit: i64) -> anyhow::Result<Vec<SessionRow>> {
        let conn = self.conn().await;
        let mut rows = conn.query(
            "SELECT id, title, created_at, last_active FROM sessions ORDER BY last_active DESC LIMIT ?1",
            Params::Positional(vec![Value::Integer(limit.clamp(1, 200))]),
        ).await?;
        let mut out = Vec::new();
        while let Some(row) = rows.next().await? {
            out.push(SessionRow {
                id: match row.get_value(0)? { Value::Text(s) => s, _ => continue },
                title: match row.get_value(1)? { Value::Text(s) => s, _ => String::new() },
                created_at: match row.get_value(2)? { Value::Text(s) => s, _ => String::new() },
                last_active: match row.get_value(3)? { Value::Text(s) => s, _ => String::new() },
            });
        }
        Ok(out)
    }

    pub async fn get_session_title(&self, id: &str) -> anyhow::Result<Option<String>> {
        let conn = self.conn().await;
        let mut rows = conn.query(
            "SELECT title FROM sessions WHERE id = ?1",
            Params::Positional(vec![Value::from(id)]),
        ).await?;
        if let Some(row) = rows.next().await? {
            match row.get_value(0)? {
                Value::Text(s) if !s.is_empty() => return Ok(Some(s)),
                _ => {}
            }
        }
        Ok(None)
    }

    pub async fn rename_session(&self, id: &str, title: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "UPDATE sessions SET title = ?1, last_active = datetime('now') WHERE id = ?2",
            Params::Positional(vec![Value::from(title), Value::from(id)]),
        ).await?;
        Ok(())
    }

    /// Persistent chat transcript for the native engine (replaces daemon history).
    /// Rows share the turn key, so live rows and history rows upsert by turn.
    pub async fn insert_chat_message(&self, session_id: &str, role: &str, content: &str, turn_id: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "INSERT INTO chat_messages (session_id, role, content, turn_id) VALUES (?1, ?2, ?3, ?4)",
            Params::Positional(vec![
                Value::from(session_id),
                Value::from(role),
                Value::from(content),
                Value::from(turn_id),
            ]),
        ).await?;
        Ok(())
    }

    pub async fn get_chat_messages(&self, session_id: &str, limit: i64) -> anyhow::Result<Vec<ChatRow>> {
        let conn = self.conn().await;
        let mut rows = conn.query(
            "SELECT id, role, content, turn_id, created_at FROM chat_messages WHERE session_id = ?1 ORDER BY id DESC LIMIT ?2",
            Params::Positional(vec![Value::from(session_id), Value::Integer(limit.clamp(1, 500))]),
        ).await?;
        let mut out = Vec::new();
        while let Some(row) = rows.next().await? {
            let id = match row.get_value(0)? { Value::Integer(i) => i, _ => continue };
            let role = match row.get_value(1)? { Value::Text(s) => s, _ => continue };
            const EMPTY: &str = "";
            let content = match row.get_value(2)? { Value::Text(s) => s, _ => String::from(EMPTY) };
            let turn_id = match row.get_value(3)? { Value::Text(s) => s, _ => String::from(EMPTY) };
            let created_at = match row.get_value(4)? { Value::Text(s) => s, _ => String::from(EMPTY) };
            out.push(ChatRow { id, role, content, turn_id, created_at });
        }
        out.reverse();
        Ok(out)
    }

    pub async fn touch_session(&self, id: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "UPDATE sessions SET last_active = datetime('now') WHERE id = ?1",
            Params::Positional(vec![Value::from(id)]),
        ).await?;
        Ok(())
    }

    pub async fn get_session(&self, id: &str) -> anyhow::Result<Option<SessionRow>> {
        let conn = self.conn().await;
        let mut rows = conn.query(
            "SELECT id, title, created_at, last_active FROM sessions WHERE id = ?1",
            Params::Positional(vec![Value::from(id)]),
        ).await?;
        if let Some(row) = rows.next().await? {
            Ok(Some(SessionRow {
                id: match row.get_value(0)? { Value::Text(s) => s, _ => return Err(anyhow::anyhow!("invalid session id")) },
                title: match row.get_value(1)? { Value::Text(s) => s, _ => String::new() },
                created_at: match row.get_value(2)? { Value::Text(s) => s, _ => String::new() },
                last_active: match row.get_value(3)? { Value::Text(s) => s, _ => String::new() },
            }))
        } else {
            Ok(None)
        }
    }

    // --- B: session state (processing/idle) for smart resume ---

    pub async fn set_session_processing(&self, id: &str, turn_id: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "UPDATE sessions SET status='processing', active_turn_id=?1, active_started_at=datetime('now'), last_active=datetime('now') WHERE id=?2",
            Params::Positional(vec![Value::from(turn_id), Value::from(id)]),
        ).await?;
        // Ensure row exists even if never upserted.
        conn.execute(
            "INSERT OR IGNORE INTO sessions (id, title, status, active_turn_id) VALUES (?1, ?2, 'processing', ?3)",
            Params::Positional(vec![Value::from(id), Value::from(id), Value::from(turn_id)]),
        ).await?;
        // Second pass in case the INSERT created idle row.
        conn.execute(
            "UPDATE sessions SET status='processing', active_turn_id=?1, active_started_at=datetime('now') WHERE id=?2 AND status!='processing'",
            Params::Positional(vec![Value::from(turn_id), Value::from(id)]),
        ).await?;
        Ok(())
    }

    pub async fn set_session_idle(&self, id: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "UPDATE sessions SET status='idle', active_turn_id='', active_started_at='' WHERE id=?1",
            Params::Positional(vec![Value::from(id)]),
        ).await?;
        Ok(())
    }

    pub async fn get_session_status(&self, id: &str) -> anyhow::Result<(String, String)> {
        let conn = self.conn().await;
        let mut rows = conn.query(
            "SELECT status, active_turn_id FROM sessions WHERE id=?1",
            Params::Positional(vec![Value::from(id)]),
        ).await?;
        if let Some(row) = rows.next().await? {
            let status = match row.get_value(0)? { Value::Text(s) => s, _ => "idle".to_string() };
            let turn = match row.get_value(1)? { Value::Text(s) => s, _ => String::new() };
            Ok((status, turn))
        } else {
            Ok(("idle".to_string(), String::new()))
        }
    }

    pub async fn sweep_stale_processing(&self, older_than_secs: i64) -> anyhow::Result<u64> {
        let conn = self.conn().await;
        let n = conn.execute(
            "UPDATE sessions SET status='idle', active_turn_id='', active_started_at='' WHERE status='processing' AND active_started_at < datetime('now', ?1)",
            Params::Positional(vec![Value::from(format!("-{} seconds", older_than_secs))]),
        ).await?;
        Ok(n as u64)
    }
}
