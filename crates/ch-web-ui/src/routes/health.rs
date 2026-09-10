//! Liveness + dependency health: does zw reach its agent daemon socket?
//!
//! GET /health -> 200 {"status":"ok", zeroclaw:{socket,reachable:true}, ...}
//!              -> 503 {"status":"degraded", ...} when the daemon socket is
//!                 unreachable (crashed/restored daemon, empty tools).
//! The wrapper proxy and the supervisor monitor poll this instead of
//! guessing from PIDs: a live PID with a dead listener reads "degraded".

use topcoat::Result;
use topcoat::context::{Cx, app_context};
use topcoat::router::{Body, Response, StatusCode, route};

use crate::context::AppContext;

fn json(status: StatusCode, v: serde_json::Value) -> Response {
    Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .header("Access-Control-Allow-Origin", "*")
        .body(Body::from(v.to_string()))
        .unwrap()
}

#[route(GET "/health")]
pub async fn health(cx: &Cx) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let socket_path = std::env::var("ZEROWRAPPER__ZEROCLAW_SOCKET")
        .unwrap_or_else(|_| "/data/zeroclaw/data/daemon.sock".to_string());
    let db_path =
        std::env::var("ZEROWRAPPER__DB_PATH").unwrap_or_default();
    let socket_ok = probe_socket(&socket_path).await;
    let db_ok = !db_path.is_empty() && std::path::Path::new(&db_path).exists();
    let (status, word) = if socket_ok {
        (StatusCode::OK, "ok")
    } else {
        (StatusCode::SERVICE_UNAVAILABLE, "degraded")
    };
    Ok(json(
        status,
        serde_json::json!({
            "status": word,
            "agent": ctx.agent,
            "zeroclaw": {"socket": socket_path, "reachable": socket_ok},
            "db": {"path": db_path, "present": db_ok},
        }),
    ))
}

/// Dial the daemon socket (2s budget). Connect success = serving.
async fn probe_socket(path: &str) -> bool {
    tokio::time::timeout(
        std::time::Duration::from_secs(2),
        tokio::net::UnixStream::connect(path),
    )
    .await
    .is_ok_and(|r| r.is_ok())
}
