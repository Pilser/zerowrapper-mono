use topcoat::Result;
use topcoat::router::{Body, Response, StatusCode, route, uri};
use topcoat::context::{Cx, app_context};

use crate::context::AppContext;

fn json(status: StatusCode, v: serde_json::Value) -> Response {
    Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .body(Body::from(v.to_string()))
        .unwrap()
}

#[route(GET "/api/sessions")]
pub async fn list(cx: &Cx) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    match ctx.db.system().list_sessions(100).await {
        Ok(rows) => Ok(json(StatusCode::OK, serde_json::json!({"ok": true, "sessions": rows}))),
        Err(e) => {
            tracing::warn!("sessions list: {e}");
            Ok(json(StatusCode::INTERNAL_SERVER_ERROR, serde_json::json!({"error": "list failed"})))
        }
    }
}

#[route(POST "/api/sessions")]
pub async fn create(cx: &Cx, body: Body) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let bytes = match topcoat::router::to_bytes(body, 100_000).await {
        Ok(b) => b,
        Err(_) => return Ok(json(StatusCode::BAD_REQUEST, serde_json::json!({"error": "invalid json"}))),
    };
    let req: serde_json::Value = serde_json::from_slice(&bytes).unwrap_or(serde_json::json!({}));
    let title = req.get("title").and_then(|t| t.as_str()).unwrap_or("").to_string();
    let id = zw_db::sessions::new_simple_id();
    let title = if title.is_empty() { id.clone() } else { title };
    if let Err(e) = ctx.db.system().create_simple_session(&id, &title).await {
        tracing::warn!("sessions create: {e}");
        return Ok(json(StatusCode::INTERNAL_SERVER_ERROR, serde_json::json!({"error": "create failed"})));
    }
    // Ensure whiteboard pages/files exist for the new thread.
    if let Some(wb) = ctx.whiteboard() {
        let _ = wb.ensure(&id).await;
    }
    let _ = uri(cx);
    Ok(json(StatusCode::CREATED, serde_json::json!({"ok": true, "session_id": id, "title": title})))
}
