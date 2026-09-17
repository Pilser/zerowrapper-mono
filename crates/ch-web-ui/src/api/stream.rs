use topcoat::Result;
use topcoat::context::{Cx, app_context};
use topcoat::router::{Body, Response, StatusCode, route, uri};

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

#[route(GET "/api/stream")]
pub async fn stream(cx: &Cx) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let query = uri(cx).query().unwrap_or("");
    let params: std::collections::HashMap<&str, &str> = query
        .split('&')
        .filter_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            let k = parts.next()?;
            let v = parts.next().unwrap_or("");
            Some((k, v))
        })
        .collect();
    let sid = sanitize_key(&params.get("session_id").map(|v| url_decode(v)).unwrap_or_default());
    let since: i64 = params.get("since").and_then(|v| v.parse().ok()).unwrap_or(0);
    let events = ctx.db.system().stream_buffer_replay(&sid, since).await.unwrap_or_default();
    let max_seq = ctx.db.system().stream_buffer_max_seq(&sid).await.unwrap_or(0);
    let (status, _) = ctx.db.system().get_session_status(&sid).await.unwrap_or(("idle".into(), "".into()));
    // also consider in-mem TASKS running?
    let payload: Vec<serde_json::Value> = events.into_iter().map(|be| {
        let mut v = be.payload;
        if let Some(o) = v.as_object_mut() { o.insert("seq".to_string(), serde_json::json!(be.seq)); }
        v
    }).collect();
    Ok(Response::builder().status(StatusCode::OK).header("Content-Type","application/json")
        .body(Body::from(serde_json::json!({"ok":true,"session_id":sid,"since":since,"max_seq":max_seq,"status":status,"events":payload}).to_string())).unwrap())
}
