//! Direct routes for the native `ask_user` flow (mirrored in root_dispatch
//! as `?api=ask_pending` / `?api=ask_answer` for proxied embeds).
use topcoat::Result;
use topcoat::router::{Body, Response, StatusCode, route, to_bytes, uri};
use topcoat::context::{Cx, app_context};

use crate::context::AppContext;

fn json(status: StatusCode, v: serde_json::Value) -> Response {
    Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .body(Body::from(v.to_string()))
        .unwrap()
}

fn query_param(cx: &Cx, key: &str) -> String {
    uri(cx)
        .query()
        .unwrap_or("")
        .split('&')
        .filter_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            let k = parts.next()?;
            let v = parts.next().unwrap_or("");
            if k == key {
                Some(v.to_string())
            } else {
                None
            }
        })
        .next()
        .unwrap_or_default()
}

#[route(GET "/api/ask/pending")]
pub async fn pending(cx: &Cx) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let sid = query_param(cx, "session_id");
    let rows = ctx
        .db
        .system()
        .ask_pending_for_session(&sid)
        .await
        .unwrap_or_default();
    Ok(json(
        StatusCode::OK,
        serde_json::json!({"ok": true, "pending": rows}),
    ))
}

#[route(POST "/api/ask/answer")]
pub async fn answer(cx: &Cx, body: Body) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let bytes = to_bytes(body, 100_000).await.unwrap_or_default();
    let req: serde_json::Value = serde_json::from_slice(&bytes).unwrap_or_default();
    let id = req
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let answers = req
        .get("answers")
        .cloned()
        .unwrap_or(serde_json::json!([]));
    if id.is_empty() {
        return Ok(json(
            StatusCode::BAD_REQUEST,
            serde_json::json!({"error": "missing id"}),
        ));
    }
    match ctx.db.system().ask_get(&id).await.unwrap_or(None) {
        None => Ok(json(
            StatusCode::NOT_FOUND,
            serde_json::json!({"error": "unknown ask id"}),
        )),
        Some(row) if row.status != "pending" => Ok(json(
            StatusCode::GONE,
            serde_json::json!({"error": "already resolved"}),
        )),
        Some(_) => {
            let _ = ctx.db.system().ask_answer(&id, &answers.to_string()).await;
            zw_agent_embed::publish_answer(&id, answers);
            Ok(json(StatusCode::OK, serde_json::json!({"ok": true})))
        }
    }
}
