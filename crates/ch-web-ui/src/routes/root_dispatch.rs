

use topcoat::Result;
use topcoat::context::{Cx, CxBuilder, app_context};
use topcoat::router::{
    Body, FromRequest, Layer, LayerFuture, Next, Response, StatusCode, headers, to_bytes, uri,
};
use topcoat::router::content::websocket::{WebSocket, WebSocketUpgrade};

use crate::context::AppContext;
use crate::ws::handler::{agent_session_list, handle_ws_connection};

/// Root-only dispatch layer: lets an embedded frontend that may only fetch `/`
/// reach the API, WebSocket, file/media and asset endpoints via query params
/// on the root URL instead of sub-paths. Registered at `/` so it wraps every
/// route; requests that are not root-dispatched pass through to the normal
/// page pipeline (which renders the chat app).
///
///   GET  /?api=history&session_id=...   -> history
///   POST /?api=upload                     -> upload
///   GET  /?ws=1                           -> WebSocket upgrade
///   GET  /?file={hash}                    -> cached file/media
///   GET  /?asset={bundled-filename}       -> bundled asset (JS/CSS)
///   GET  /?wb={slug}                      -> public whiteboard snapshot
///   GET  /                                -> root HTML (chat, via next)
///
/// `?wb=` is honored on any path, so an embed behind a tenant prefix
/// (`/tenant_<id>/?wb=<slug>`) resolves without needing a dedicated route.
#[derive(Debug, Clone, Default)]
pub struct RootDispatchLayer;

fn query_value(cx: &Cx, key: &str) -> Option<String> {
    let query = uri(cx).query().unwrap_or("");
    query
        .split('&')
        .filter_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            let k = parts.next()?;
            let v = parts.next().unwrap_or("");
            Some((k.to_string(), v.to_string()))
        })
        .find(|(k, _)| k == key)
        .map(|(_, v)| v)
}

fn url_decode(s: &str) -> String {
    s.replace("%20", " ")
        .replace("%3A", ":")
        .replace("%2F", "/")
        .replace("%3F", "?")
        .replace("%3D", "=")
        .replace("%26", "&")
        .replace("%40", "@")
}

fn sanitize_key(raw: &str) -> String {
    raw.chars()
        .map(|c| if c.is_alphanumeric() || c == '_' || c == '-' || c == '.' || c == '@' { c } else { '_' })
        .collect()
}

impl Layer for RootDispatchLayer {
    fn path(&self) -> &topcoat::router::Path {
        topcoat::router::Path::new("/")
    }

    fn handle<'a>(&'a self, cx: &'a mut CxBuilder, body: Body, next: Next<'a>) -> LayerFuture<'a> {
        Box::pin(async move {
            // WebSocket upgrade: browser connects to `/?ws=1`.
            if query_value(cx, "ws").is_some() {
                return root_ws(cx, body).await;
            }

            // Bundled asset: `/?asset=app-<hash>.js`
            if let Some(name) = query_value(cx, "asset") {
                return serve_asset(&name).await;
            }

            // Cached file/media: `/?file=<hash>`
            if let Some(hash) = query_value(cx, "file") {
                return serve_file(cx, &hash).await;
            }

            // Public whiteboard snapshot: `/?wb=<slug>` (any path, so it
            // also works as `/tenant_<id>/?wb=<slug>` behind an embed prefix).
            if let Some(slug) = query_value(cx, "wb") {
                return serve_public_snapshot(cx, &slug).await;
            }

            // API: `/?api=history&session_id=...`, `/?api=sessions`, `/?api=upload`
            if let Some(api) = query_value(cx, "api") {
                return dispatch_api(cx, &api, body).await;
            }

            // Everything else (including unknown sub-paths) falls through to
            // the normal page pipeline, which renders the chat app at `/`.
            next.run(cx, body).await
        })
    }
}

async fn root_ws(cx: &Cx, body: Body) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let whiteboard = app.whiteboard().cloned();
    let buffer_db = app.db.system().clone();

    let upgrade = WebSocketUpgrade::from_request(cx, body).await?;
    upgrade.on_upgrade(move |socket: WebSocket| async move {
        handle_ws_connection(socket, whiteboard, buffer_db).await;
    })
}

async fn dispatch_api(cx: &Cx, api: &str, body: Body) -> Result<Response> {
    match api {
        "history" => api_history(cx).await,
        "stream" => api_stream(cx).await,
        "sessions" => api_sessions_list(cx).await,
        "ask_pending" => api_ask_pending(cx).await,
        "ask_answer" => api_ask_answer(cx, body).await,
        "files_open" => api_files_open(cx).await,
        "files_close" => api_files_close(cx, body).await,
        "agent_sessions" => Ok(Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", "application/json")
            .body(Body::from(
                serde_json::json!({"ok": true, "sessions": agent_session_list().await}).to_string(),
            ))
            .unwrap()),
        "sessions_create" => api_sessions_create(cx, body).await,
        "upload" => api_upload(cx, body).await,
        "inspect_snap" => crate::api::inspect_snap::handle_inspect_snap(cx, body).await,
        _ => Ok(Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": "unknown api"}).to_string()))
            .unwrap()),
    }
}

/// Mirrors `api/history.rs` but keyed from the root query params.
/// Single-user, no identity: ?session_id=sess_xxx is required.
async fn api_history(cx: &Cx) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let direct = query_value(cx, "session_id").map(|v| url_decode(&v)).unwrap_or_default();
    let session_id = if !direct.is_empty() {
        sanitize_key(&direct)
    } else {
        return Ok(Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": "Missing session_id"}).to_string()))
            .unwrap());
    };

    // B: unified history — DB cache + status so frontend knows whether to
    // resume via WS or poll HTTP while `processing`. Never returns a stale
    // file that hides the in-flight user prompt.
    let snap = crate::ws::handler::history_snapshot(app.db.system(), &session_id).await;
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Body::from(snap.to_string()))
        .unwrap())
}

async fn api_sessions_list(cx: &Cx) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    match app.db.system().list_sessions(100).await {
        Ok(rows) => Ok(Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"ok": true, "sessions": rows}).to_string()))
            .unwrap()),
        Err(_) => Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": "list failed"}).to_string()))
            .unwrap()),
    }
}

async fn api_sessions_create(cx: &Cx, body: Body) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let id = zw_db::sessions::new_simple_id();
    let _ = to_bytes(body, 100_000).await;
    let _ = cx;
    if let Err(e) = app.db.system().create_simple_session(&id, &id).await {
        tracing::warn!("sessions create: {e}");
        return Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": "create failed"}).to_string()))
            .unwrap());
    }
    if let Some(wb) = app.whiteboard() {
        let _ = wb.ensure(&id).await;
    }
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Body::from(serde_json::json!({"ok": true, "session_id": id, "title": id}).to_string()))
        .unwrap())
}

/// Pending human questions for the native `ask_user` tool (drawer polls).
async fn api_ask_pending(cx: &Cx) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let sid = sanitize_key(&query_value(cx, "session_id").unwrap_or_default());
    let rows = app
        .db
        .system()
        .ask_pending_for_session(&sid)
        .await
        .unwrap_or_default();
    let pending: Vec<serde_json::Value> = rows
        .iter()
        .map(|r| {
            let kind = if r.id.starts_with("continue-") {
                "system-continue"
            } else {
                "model"
            };
            serde_json::json!({"id": r.id, "session_id": r.session_id, "questions": serde_json::from_str::<serde_json::Value>(&r.questions).unwrap_or(serde_json::json!([])), "status": r.status, "kind": kind})
        })
        .collect();
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Body::from(
            serde_json::json!({"ok": true, "pending": pending}).to_string(),
        ))
        .unwrap())
}

async fn api_files_open(cx: &Cx) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let sid = sanitize_key(&query_value(cx, "session_id").unwrap_or_default());
    let mut files = app.db.system().open_files_list(&sid).await.unwrap_or_default();
    if files.is_empty() && sid != "shared" {
        files = app.db.system().open_files_list("shared").await.unwrap_or_default();
    }
    let list: Vec<serde_json::Value> = files
        .iter()
        .map(|f| {
            serde_json::json!({
                "id": f.id,
                "path": f.original_path,
                "url": format!("/files/show/{}", f.id),
                "download_url": format!("/files/show/{}?download=1", f.id),
                "name": std::path::Path::new(&f.original_path).file_name().and_then(|n| n.to_str()).unwrap_or("file")
            })
        })
        .collect();
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Body::from(serde_json::json!({ "files": list }).to_string()))
        .unwrap())
}

/// HTTP fallback for `stream_buffer` replay when WS is down but session is
/// still `processing`. Frontend polls `?api=stream&session_id=&since=` till
/// `status` flips to `idle` (or WS resumes).
async fn api_stream(cx: &Cx) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let sid = sanitize_key(&query_value(cx, "session_id").unwrap_or_default());
    let since: i64 = query_value(cx, "since").and_then(|v| v.parse().ok()).unwrap_or(0);
    let events = app.db.system().stream_buffer_replay(&sid, since).await.unwrap_or_default();
    let max_seq = app.db.system().stream_buffer_max_seq(&sid).await.unwrap_or(0);
    let (status, _) = app.db.system().get_session_status(&sid).await.unwrap_or(("idle".into(), "".into()));
    let payload: Vec<serde_json::Value> = events.into_iter().map(|be| {
        let mut v = be.payload;
        if let Some(o) = v.as_object_mut() { o.insert("seq".to_string(), serde_json::json!(be.seq)); }
        v
    }).collect();
    Ok(Response::builder().status(StatusCode::OK).header("Content-Type","application/json")
        .body(Body::from(serde_json::json!({"ok":true,"session_id":sid,"since":since,"max_seq":max_seq,"status":status,"events":payload}).to_string())).unwrap())
}

/// Answer a pending question set: persists + wakes the waiting tool call.
/// Late answers are fine — the turn waits server-side, never on the socket.
async fn api_ask_answer(cx: &Cx, body: Body) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let bytes = to_bytes(body, 100_000).await.unwrap_or_default();
    let req: serde_json::Value = serde_json::from_slice(&bytes).unwrap_or_default();
    let id = req.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let answers = req.get("answers").cloned().unwrap_or(serde_json::json!([]));
    if id.is_empty() {
        return Ok(Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": "missing id"}).to_string()))
            .unwrap());
    }
    let existing = app.db.system().ask_get(&id).await.unwrap_or(None);
    match existing {
        None => Ok(Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": "unknown ask id"}).to_string()))
            .unwrap()),
        Some(row) if row.status != "pending" => Ok(Response::builder()
            .status(StatusCode::GONE)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": "already resolved"}).to_string()))
            .unwrap()),
        Some(_) => {
            let _ = app.db.system().ask_answer(&id, &answers.to_string()).await;
            zw_agent_embed::publish_answer(&id, answers);
            Ok(Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::json!({"ok": true}).to_string()))
                .unwrap())
        }
    }
}

async fn api_files_close(cx: &Cx, body: Body) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let bytes = to_bytes(body, 100_000).await.unwrap_or_default();
    let req: serde_json::Value = serde_json::from_slice(&bytes).unwrap_or_default();
    let file_id = req
        .get("file_id")
        .and_then(|v| v.as_str())
        .or_else(|| query_value(cx, "file_id").as_deref())
        .unwrap_or("")
        .to_string();
    let sid = req
        .get("session_id")
        .and_then(|v| v.as_str())
        .or_else(|| query_value(cx, "session_id").as_deref())
        .unwrap_or("shared")
        .to_string();
    if file_id.is_empty() {
        return Ok(Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::json!({"error": "missing file_id"}).to_string()))
            .unwrap());
    }
    let _ = app.db.system().open_file_remove(&sid, &file_id).await;
    if sid != "shared" {
        let _ = app.db.system().open_file_remove("shared", &file_id).await;
    }
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Body::from(serde_json::json!({"ok": true}).to_string()))
        .unwrap())
}

/// Mirrors `api/upload.rs` but keyed from the root query params.
async fn api_upload(cx: &Cx, body: Body) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let filename = headers(cx)
        .get("X-Filename")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("upload")
        .to_string();

    let body_bytes = match to_bytes(body, usize::MAX).await {
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

    tokio::fs::create_dir_all(&app.upload_dir).await.unwrap_or_default();

    let now = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let safe_name: String = filename
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let ext = std::path::Path::new(&safe_name)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("bin");
    let stem = std::path::Path::new(&safe_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file");
    let dest_name = format!("{}_{}.{}", stem, now, ext);
    let dest_path = app.upload_dir.join(&dest_name);

    tracing::info!("Saving uploaded file to {:?}", dest_path);

    if let Err(e) = tokio::fs::write(&dest_path, &body_bytes).await {
        return Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .header("Content-Type", "application/json")
            .body(Body::from(
                serde_json::json!({"error": format!("Failed to save file: {}", e)}).to_string(),
            ))
            .unwrap());
    }

    let abs_path = std::fs::canonicalize(&dest_path)
        .unwrap_or_else(|_| dest_path.clone());
    let abs_str = abs_path.to_string_lossy().to_string();
    let hash = match app.cache.resolve(&abs_str) {
        Ok(cf) => cf.hash,
        Err(_) => zw_cache::disk::hash_path(&abs_str),
    };

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Body::from(
            serde_json::json!({
                "filename": safe_name,
                "path": abs_str,
                "size": body_bytes.len(),
                "mime_type": mime_guess::from_path(&safe_name).first_or_octet_stream().to_string(),
                "hash": hash,
                "url": format!("/files/{}", hash)
            })
            .to_string(),
        ))
        .unwrap())
}

async fn serve_asset(name: &str) -> Result<Response> {
    let assets_dir = std::env::var("TOPCOAT_ASSETS_DIR").unwrap_or_else(|_| "assets".to_string());
    let path = std::path::Path::new(&assets_dir).join(name);
    let mime = if name.ends_with(".js") {
        "text/javascript"
    } else if name.ends_with(".css") {
        "text/css"
    } else {
        "application/octet-stream"
    };
    match tokio::fs::read(&path).await {
        Ok(data) => Ok(Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", mime)
            .header("Cache-Control", "public, max-age=31536000, immutable")
            .body(Body::from(data))
            .unwrap()),
        Err(_) => Ok(Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(Body::from("Not found"))
            .unwrap()),
    }
}

async fn serve_file(cx: &Cx, hash: &str) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let meta = match app.cache.get_meta(hash) {
        Ok(Some(m)) => m,
        _ => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("File not found"))
                .unwrap());
        }
    };
    match tokio::fs::read(&meta.original_path).await {
        Ok(data) => Ok(Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", &meta.mime_type)
            .header("Cache-Control", "public, max-age=3600")
            .body(Body::from(data))
            .unwrap()),
        Err(_) => Ok(Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(Body::from("File not found"))
            .unwrap()),
    }
}

/// Public whiteboard snapshot via `?wb=<slug>`, honored on any path so embeds
/// behind a prefix (`/tenant_<id>/?wb=<slug>`) work. Assets render against the
/// request directory as `<base href>`, mirroring the chat layout.
async fn serve_public_snapshot(cx: &Cx, slug: &str) -> Result<Response> {
    let app: &AppContext = app_context(cx);
    let clean: String = slug.chars().filter(|c| c.is_alphanumeric()).collect();
    if clean.is_empty() {
        return Ok(Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header("Content-Type", "text/html; charset=utf-8")
            .body(Body::from("<h1>Page not found</h1>"))
            .unwrap());
    }
    let req_path = uri(cx).path().to_string();
    let base_href = if req_path.ends_with('/') {
        req_path.clone()
    } else {
        match req_path.rfind('/') {
            Some(idx) => req_path[..=idx].to_string(),
            None => "/".to_string(),
        }
    };
    crate::routes::public_wb::render_snapshot(app, cx, &clean, &base_href).await
}
