use crate::DbPool;
use serde_json::Value;
use turso::params::Params;
use turso::Value as TursoValue;

#[derive(Debug, Clone)]
pub struct BufferedEvent {
    pub seq: i64,
    pub r#type: String,
    pub payload: Value,
}

impl DbPool {
    pub async fn stream_buffer_append(&self, session_id: &str, event: &Value) -> anyhow::Result<i64> {
        let r#type = event.get("type").and_then(|v| v.as_str()).unwrap_or("").to_string();
        if r#type.is_empty() {
            return Ok(0);
        }
        let payload = serde_json::to_string(event)?;
        let conn = self.conn().await;
        let mut rows = conn
            .query(
                "SELECT COALESCE(MAX(seq),0) FROM stream_buffer WHERE session_id=?1",
                Params::Positional(vec![TursoValue::from(session_id)]),
            )
            .await?;
        let next = if let Some(row) = rows.next().await? {
            match row.get_value(0)? {
                TursoValue::Integer(i) => i + 1,
                _ => 1,
            }
        } else {
            1
        };
        conn.execute(
            "INSERT INTO stream_buffer (session_id, seq, type, payload) VALUES (?1,?2,?3,?4)",
            Params::Positional(vec![
                TursoValue::from(session_id),
                TursoValue::Integer(next),
                TursoValue::from(r#type),
                TursoValue::from(payload),
            ]),
        )
        .await?;
        // Tag the live event with its seq so the client can track lastSeq.
        Ok(next)
    }

    pub async fn stream_buffer_replay(
        &self,
        session_id: &str,
        since: i64,
    ) -> anyhow::Result<Vec<BufferedEvent>> {
        let conn = self.conn().await;
        let mut rows = conn
            .query(
                "SELECT seq, type, payload FROM stream_buffer WHERE session_id=?1 AND seq>?2 ORDER BY seq",
                Params::Positional(vec![TursoValue::from(session_id), TursoValue::Integer(since)]),
            )
            .await?;
        let mut out = Vec::new();
        while let Some(row) = rows.next().await? {
            let seq = match row.get_value(0)? {
                TursoValue::Integer(i) => i,
                _ => continue,
            };
            let r#type = match row.get_value(1)? {
                TursoValue::Text(s) => s,
                _ => continue,
            };
            let payload_str = match row.get_value(2)? {
                TursoValue::Text(s) => s,
                _ => continue,
            };
            let payload: Value = serde_json::from_str(&payload_str).unwrap_or(Value::Null);
            out.push(BufferedEvent { seq, r#type, payload });
        }
        Ok(out)
    }

    pub async fn stream_buffer_max_seq(&self, session_id: &str) -> anyhow::Result<i64> {
        let conn = self.conn().await;
        let mut rows = conn
            .query(
                "SELECT COALESCE(MAX(seq),0) FROM stream_buffer WHERE session_id=?1",
                Params::Positional(vec![TursoValue::from(session_id)]),
            )
            .await?;
        if let Some(row) = rows.next().await? {
            match row.get_value(0)? {
                TursoValue::Integer(i) => Ok(i),
                _ => Ok(0),
            }
        } else {
            Ok(0)
        }
    }

    pub async fn stream_buffer_sweep(&self) -> anyhow::Result<u64> {
        let conn = self.conn().await;
        // Completed turns drain after 10 minutes; abandoned in-flight (no
        // turn_complete/done) drains after 60 minutes.
        let n1 = conn
            .execute(
                "DELETE FROM stream_buffer WHERE type IN ('done','turn_complete','error') AND created_at < datetime('now','-10 minutes')",
                Params::None,
            )
            .await?;
        // For buffered chunks, keep them 10 min after their turn's terminal
        // event, but if no terminal event ever arrived (server went off),
        // expire after 60 min. Simplest: delete any buffer whose newest
        // terminal for that session is older than 10 min, or any orphan row
        // older than 60 min.
        let n2 = conn
            .execute(
                "DELETE FROM stream_buffer WHERE session_id IN (
                    SELECT session_id FROM stream_buffer GROUP BY session_id
                    HAVING MAX(CASE WHEN type IN ('done','turn_complete','error') THEN seq ELSE -1 END) >= 0
                    AND (SELECT MAX(created_at) FROM stream_buffer s2 WHERE s2.session_id=stream_buffer.session_id AND s2.type IN ('done','turn_complete','error')) < datetime('now','-10 minutes')
                )",
                Params::None,
            )
            .await?;
        let n3 = conn
            .execute(
                "DELETE FROM stream_buffer WHERE created_at < datetime('now','-60 minutes')",
                Params::None,
            )
            .await?;
        Ok((n1 + n2 + n3) as u64)
    }
}
