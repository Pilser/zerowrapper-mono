//! Liveness + dependency health: is the native provider configured?
//!
//! GET /health -> 200 {"status":"ok", provider:{online:true,...}, ...}
//!              -> 503 {"status":"degraded", ...} when no provider key
//!                 resolves (misconfigured `ZS_PROVIDER`/key env).
//! No network is burned: the check is config + key presence only.
//! The wrapper proxy and the supervisor monitor poll this instead of
//! guessing from PIDs.

use topcoat::Result;
use topcoat::context::Cx;
use topcoat::router::{Body, Response, StatusCode, route};

fn json(status: StatusCode, v: serde_json::Value) -> Response {
    Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .header("Access-Control-Allow-Origin", "*")
        .body(Body::from(v.to_string()))
        .unwrap()
}

#[route(GET "/health")]
pub async fn health(_cx: &Cx) -> Result<Response> {
    let provider = zw_agent_embed::provider_health();
    let provider_ok = provider
        .get("online")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let db_path = std::env::var("ZEROWRAPPER__DB_PATH").unwrap_or_default();
    let db_ok = !db_path.is_empty() && std::path::Path::new(&db_path).exists();
    let (status, word) = if provider_ok {
        (StatusCode::OK, "ok")
    } else {
        (StatusCode::SERVICE_UNAVAILABLE, "degraded")
    };
    Ok(json(
        status,
        serde_json::json!({
            "status": word,
            "provider": provider,
            "db": {"path": db_path, "present": db_ok},
        }),
    ))
}
