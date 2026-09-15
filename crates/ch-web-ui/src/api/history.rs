use topcoat::Result;
use topcoat::router::{Body, Response, StatusCode, route, uri};
use topcoat::context::{Cx, app_context};

use crate::context::AppContext;

fn sanitize_key(raw: &str) -> String {
    raw.chars()
        .map(|c| if c.is_alphanumeric() || c == '_' || c == '-' || c == '.' || c == '@' { c } else { '_' })
        .collect()
}

fn url_decode(s: &str) -> String {
    s.replace("%20", " ")
        .replace("%3A", ":")
        .replace("%2F", "/")
        .replace("%3F", "?")
        .replace("%3D", "=")
        .replace("%26", "&")
}

#[route(GET "/api/history")]
pub async fn history(cx: &Cx) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);

    let query = uri(cx).query().unwrap_or("");
    let params: std::collections::HashMap<&str, &str> = query
        .split('&')
        .filter_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            let key = parts.next()?;
            let val = parts.next().unwrap_or("");
            Some((key, val))
        })
        .collect();

    // Single-user: prefer ?session_id=sess_xxx, fallback to legacy ?user_id=.
    let direct_sid = params.get("session_id").map(|v| url_decode(v)).unwrap_or_default();
    let user_id = params.get("user_id").map(|v| url_decode(v)).unwrap_or_default();
    let _role = params.get("role").map(|v| url_decode(v)).unwrap_or_else(|| "public".to_string());

    let session_id = if !direct_sid.is_empty() {
        sanitize_key(&direct_sid)
    } else {
        if user_id.is_empty() {
            return Ok(Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::json!({"error": "Missing session_id"}).to_string(),
                ))
                .unwrap());
        }
        format!("web.{}.{}", ctx.agent, sanitize_key(&user_id))
    };

    // Native transcript (chat_messages), written by every completed turn.
    match ctx.db.system().get_chat_messages(&session_id, 100).await {
        Ok(rows) => {
            Ok(Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::json!({
                        "session_id": session_id,
                        "messages": rows,
                        "total": rows.len(),
                        "start": 0
                    })
                    .to_string(),
                ))
                .unwrap())
        }
        Err(e) => {
            tracing::warn!("history: db error: {}", e);
            Ok(Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::json!({
                        "session_id": session_id,
                        "messages": [],
                        "total": 0,
                        "start": 0
                    })
                    .to_string(),
                ))
                .unwrap())
        }
    }
}
