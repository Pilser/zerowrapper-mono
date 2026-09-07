use crate::DbPool;
use turso::params::Params;
use turso::Value;

#[derive(Debug, Clone, serde::Serialize)]
pub struct SessionRow {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub agent_alias: String,
    pub account: Option<String>,
    pub chat_id: Option<String>,
    pub channel: String,
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
    pub async fn upsert_session(
        &self,
        id: &str,
        user_id: &str,
        agent_alias: &str,
        account: Option<&str>,
        chat_id: Option<&str>,
        channel: &str,
    ) -> anyhow::Result<()> {
        // Single-user mode: empty user becomes "single", title defaults to id.
        let user = if user_id.is_empty() { "single" } else { user_id };
        let conn = self.conn().await;
        conn.execute(
            "INSERT OR IGNORE INTO sessions (id, user_id, title, agent_alias, account, chat_id, channel) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            Params::Positional(vec![
                Value::from(id),
                Value::from(user),
                Value::from(id),
                Value::from(agent_alias),
                account.map(Value::from).unwrap_or(Value::Null),
                chat_id.map(Value::from).unwrap_or(Value::Null),
                Value::from(channel),
            ]),
        ).await?;
        Ok(())
    }

    /// Create a simple single-user thread session: sess_xxx + title.
    pub async fn create_simple_session(&self, id: &str, title: &str, agent_alias: &str, channel: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "INSERT OR IGNORE INTO sessions (id, user_id, title, agent_alias, channel) VALUES (?1, 'single', ?2, ?3, ?4)",
            Params::Positional(vec![
                Value::from(id),
                Value::from(title),
                Value::from(agent_alias),
                Value::from(channel),
            ]),
        ).await?;
        Ok(())
    }

    pub async fn list_sessions(&self, limit: i64) -> anyhow::Result<Vec<SessionRow>> {
        let conn = self.conn().await;
        let mut rows = conn.query(
            "SELECT id, user_id, title, agent_alias, account, chat_id, channel, created_at, last_active FROM sessions ORDER BY last_active DESC LIMIT ?1",
            Params::Positional(vec![Value::Integer(limit.clamp(1, 200))]),
        ).await?;
        let mut out = Vec::new();
        while let Some(row) = rows.next().await? {
            out.push(SessionRow {
                id: match row.get_value(0)? { Value::Text(s) => s, _ => continue },
                user_id: match row.get_value(1)? { Value::Text(s) => s, _ => String::from("single") },
                title: match row.get_value(2)? { Value::Text(s) => s, _ => String::new() },
                agent_alias: match row.get_value(3)? { Value::Text(s) => s, _ => String::new() },
                account: match row.get_value(4)? { Value::Text(s) => Some(s), _ => None },
                chat_id: match row.get_value(5)? { Value::Text(s) => Some(s), _ => None },
                channel: match row.get_value(6)? { Value::Text(s) => s, _ => String::from("web") },
                created_at: match row.get_value(7)? { Value::Text(s) => s, _ => String::new() },
                last_active: match row.get_value(8)? { Value::Text(s) => s, _ => String::new() },
            });
        }
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
            "SELECT id, user_id, title, agent_alias, account, chat_id, channel, created_at, last_active FROM sessions WHERE id = ?1",
            Params::Positional(vec![Value::from(id)]),
        ).await?;
        if let Some(row) = rows.next().await? {
            Ok(Some(SessionRow {
                id: match row.get_value(0)? { Value::Text(s) => s, _ => return Err(anyhow::anyhow!("invalid session id")) },
                user_id: match row.get_value(1)? { Value::Text(s) => s, _ => String::from("single") },
                title: match row.get_value(2)? { Value::Text(s) => s, _ => String::new() },
                agent_alias: match row.get_value(3)? { Value::Text(s) => s, _ => return Err(anyhow::anyhow!("invalid agent_alias")) },
                account: match row.get_value(4)? { Value::Text(s) => Some(s), _ => None },
                chat_id: match row.get_value(5)? { Value::Text(s) => Some(s), _ => None },
                channel: match row.get_value(6)? { Value::Text(s) => s, _ => String::from("web") },
                created_at: match row.get_value(7)? { Value::Text(s) => s, _ => String::new() },
                last_active: match row.get_value(8)? { Value::Text(s) => s, _ => String::new() },
            }))
        } else {
            Ok(None)
        }
    }
}
