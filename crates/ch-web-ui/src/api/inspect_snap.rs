use topcoat::Result;
use topcoat::router::{Body, Response, StatusCode, route, to_bytes, headers};
use topcoat::context::{Cx, app_context};

use crate::context::AppContext;

#[route(POST "/api/inspect/snap")]
pub async fn inspect_snap(cx: &Cx, body: Body) -> Result<Response> {
    handle_inspect_snap(cx, body).await
}

pub async fn handle_inspect_snap(cx: &Cx, body: Body) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);

    let filename = headers(cx)
        .get("X-Filename")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("snap.png")
        .to_string();
    let target = headers(cx)
        .get("X-Target")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("#whiteboard-body")
        .to_string();

    let body_bytes = match to_bytes(body, 25_000_000).await {
        Ok(b) => b,
        Err(e) => {
            return Ok(Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    serde_json::json!({"error": format!("Failed to read body: {}", e)}).to_string(),
                ))
                .unwrap());
        }
    };

    if body_bytes.is_empty() {
        return Ok(Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": "Empty file"}).to_string()))
            .unwrap());
    }

    // Temp folder in agent path: whiteboard_dir/temp
    let whiteboard_dir = ctx.whiteboard.as_ref().map(|h| h.dir().to_path_buf()).unwrap_or_else(|| ctx.upload_dir.clone());
    let temp_dir = whiteboard_dir.join("temp");
    let _ = tokio::fs::create_dir_all(&temp_dir).await;
    let _ = tokio::fs::create_dir_all(&ctx.upload_dir).await;

    let now = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let millis = chrono::Utc::now().timestamp_millis();
    let safe_target: String = target.chars().map(|c| if c.is_alphanumeric() { c } else { '_' }).collect();
    // Use filename stem
    let dest_name = format!("snap-{}-{}-{}.png", now, millis % 10000, &safe_target[..safe_target.len().min(12)]);
    let dest_path = temp_dir.join(&dest_name);

    if let Err(e) = tokio::fs::write(&dest_path, &body_bytes).await {
        return Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": format!("Failed to save snap: {}", e)}).to_string()))
            .unwrap());
    }

    let abs_path = std::fs::canonicalize(&dest_path).unwrap_or_else(|_| dest_path.clone());
    let abs_str = abs_path.to_string_lossy().to_string();
    let hash = match ctx.cache.resolve(&abs_str) {
        Ok(cf) => cf.hash,
        Err(_) => zw_cache::disk::hash_path(&abs_str),
    };

    // Also copy to upload_dir for backup (optional)
    let upload_path = ctx.upload_dir.join(&dest_name);
    let _ = tokio::fs::write(&upload_path, &body_bytes).await;

    // Also report to inspect-reports board (shared) best-effort
    let store = ctx.db.clone();
    let url = format!("/files/{}", hash);
    let target_clone = target.clone();
    let hash_clone = hash.clone();
    let path_clone = abs_str.clone();
    tokio::spawn(async move {
        if let Ok(pool) = store.session("shared").await {
            if pool.srv_app_by_id("inspect-reports").await.unwrap_or(None).is_none() {
                let _ = pool.srv_app_create_with_id("inspect-reports", "shared", "inspect-reports", None, true, None).await;
                let _ = store.register_board("shared", "inspect-reports", "shared").await;
            }
            let payload = serde_json::json!({
                "type": "snap",
                "check": "snap",
                "ok": true,
                "url": url,
                "path": path_clone,
                "hash": hash_clone,
                "target": target_clone,
                "ts": chrono::Utc::now().timestamp_millis()
            });
            let _ = pool.srv_record_insert("inspect-reports", &payload, None, false).await;
        }
    });

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Body::from(
            serde_json::json!({
                "ok": true,
                "filename": filename,
                "target": target,
                "path": abs_str,
                "hash": hash,
                "url": format!("/files/{}", hash)
            })
            .to_string(),
        ))
        .unwrap())
}
