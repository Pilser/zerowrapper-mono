use topcoat::Result;
use topcoat::router::{Body, Response, StatusCode, route, path_param};
use topcoat::context::{Cx, app_context};

use crate::context::AppContext;

#[path_param]
struct FileHash(str);

#[route(GET "/favicon.svg")]
pub async fn favicon(cx: &Cx) -> Result<Response> {
    static_file(cx, "favicon.svg", "image/svg+xml").await
}

#[route(GET "/logo.svg")]
pub async fn logo(cx: &Cx) -> Result<Response> {
    static_file(cx, "logo.svg", "image/svg+xml").await
}

#[route(GET "/robots.txt")]
pub async fn robots(cx: &Cx) -> Result<Response> {
    static_file(cx, "robots.txt", "text/plain").await
}

async fn static_file(cx: &Cx, name: &str, mime: &str) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let path = ctx.config_dir.join(name);

    let data = match tokio::fs::read(&path).await {
        Ok(d) => d,
        Err(_) => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("Not found"))
                .unwrap());
        }
    };

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("content-type", mime)
        .header("cache-control", "public, max-age=3600")
        .body(Body::from(data))
        .unwrap())
}

#[route(GET "/files/show/{file_id}")]
pub async fn files_show(cx: &Cx) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let file_id = path_param::<FileHash>(cx);
    let query = topcoat::router::uri(cx).query().unwrap_or("");
    let is_download = query.contains("download=1");
    let original_path = match ctx.db.system().file_view_resolve(file_id.as_str()).await.unwrap_or(None) {
        Some(p) => p,
        None => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("File view not found"))
                .unwrap());
        }
    };
    let data = match tokio::fs::read(&original_path).await {
        Ok(d) => d,
        Err(e) => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from(format!("Error reading file: {}", e)))
                .unwrap());
        }
    };
    let mime = mime_guess::from_path(&original_path).first_or_octet_stream().to_string();
    let mut builder = Response::builder()
        .status(StatusCode::OK)
        .header("content-type", mime)
        .header("cache-control", "public, max-age=60");
    if is_download {
        let filename = std::path::Path::new(&original_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("download");
        builder = builder.header(
            "content-disposition",
            format!("attachment; filename=\"{}\"", filename),
        );
    }
    Ok(builder.body(Body::from(data)).unwrap())
}

#[route(GET "/files/{file_hash}")]
pub async fn files(cx: &Cx) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let hash = path_param::<FileHash>(cx);

    let meta = match ctx.cache.get_meta(hash) {
        Ok(Some(m)) => m,
        Ok(None) => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("File not found"))
                .unwrap());
        }
        Err(e) => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from(format!("Cache error: {}", e)))
                .unwrap());
        }
    };

    let data = match tokio::fs::read(&meta.original_path).await {
        Ok(d) => d,
        Err(e) => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from(format!("Error reading file: {}", e)))
                .unwrap());
        }
    };

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("content-type", &meta.mime_type)
        .header("cache-control", "public, max-age=3600")
        .body(Body::from(data))
        .unwrap())
}