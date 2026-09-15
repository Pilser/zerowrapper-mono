//! Durable ask queue for the native `ask_user` tool: the agent's questions
//! survive websocket drops and restarts; answers arrive via REST, never the
//! live socket.
use crate::DbPool;
use turso::params::Params;
use turso::Value;

#[derive(Debug, Clone, serde::Serialize)]
pub struct AskRow {
    pub id: String,
    pub session_id: String,
    pub questions: String,
    pub status: String,
    pub answers: String,
    pub created_at: String,
}

fn row_text(row: &turso::Row, i: usize) -> String {
    match row.get_value(i) {
        Ok(Value::Text(s)) => s,
        _ => String::new(),
    }
}

fn row_to_ask(row: &turso::Row) -> anyhow::Result<AskRow> {
    Ok(AskRow {
        id: row_text(row, 0),
        session_id: row_text(row, 1),
        questions: row_text(row, 2),
        status: row_text(row, 3),
        answers: row_text(row, 4),
        created_at: row_text(row, 5),
    })
}

impl DbPool {
    pub async fn ask_insert(&self, id: &str, session_id: &str, questions: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "INSERT INTO ask_requests (id, session_id, questions, status) VALUES (?1, ?2, ?3, 'pending')",
            Params::Positional(vec![
                Value::from(id),
                Value::from(session_id),
                Value::from(questions),
            ]),
        )
        .await?;
        Ok(())
    }

    pub async fn ask_pending_for_session(&self, session_id: &str) -> anyhow::Result<Vec<AskRow>> {
        let conn = self.conn().await;
        let mut rows = conn
            .query(
                "SELECT id, session_id, questions, status, answers, created_at FROM ask_requests WHERE session_id = ?1 AND status = 'pending' ORDER BY id ASC",
                Params::Positional(vec![Value::from(session_id)]),
            )
            .await?;
        let mut out = Vec::new();
        while let Some(row) = rows.next().await? {
            out.push(row_to_ask(&row)?);
        }
        Ok(out)
    }

    pub async fn ask_get(&self, id: &str) -> anyhow::Result<Option<AskRow>> {
        let conn = self.conn().await;
        let mut rows = conn
            .query(
                "SELECT id, session_id, questions, status, answers, created_at FROM ask_requests WHERE id = ?1",
                Params::Positional(vec![Value::from(id)]),
            )
            .await?;
        if let Some(row) = rows.next().await? {
            Ok(Some(row_to_ask(&row)?))
        } else {
            Ok(None)
        }
    }

    pub async fn ask_answer(&self, id: &str, answers: &str) -> anyhow::Result<bool> {
        let conn = self.conn().await;
        let n = conn
            .execute(
                "UPDATE ask_requests SET status = 'answered', answers = ?1, resolved_at = datetime('now') WHERE id = ?2 AND status = 'pending'",
                Params::Positional(vec![Value::from(answers), Value::from(id)]),
            )
            .await?;
        Ok(n > 0)
    }

    pub async fn ask_expire(&self, id: &str) -> anyhow::Result<()> {
        let conn = self.conn().await;
        conn.execute(
            "UPDATE ask_requests SET status = 'expired', resolved_at = datetime('now') WHERE id = ?1 AND status = 'pending'",
            Params::Positional(vec![Value::from(id)]),
        )
        .await?;
        Ok(())
    }
}
