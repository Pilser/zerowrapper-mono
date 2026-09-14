use topcoat::Result;
use topcoat::view::{view, Unescaped};
use topcoat::router::{Body, Response, StatusCode, route, path_param, IntoResponse};
use topcoat::context::{Cx, app_context};
use topcoat::asset::bundled_asset;

use crate::context::AppContext;
use crate::assets::{STYLESHEET, PUBLIC_WB_JS, MERMAID_JS, MARKED_JS, HIGHLIGHT_JS, KATEX_JS, KATEX_CSS};

#[path_param]
struct WbSlug(str);

#[route(GET "/w/{wb_slug}")]
pub async fn public_wb(cx: &Cx) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let slug = path_param::<WbSlug>(cx);
    render_snapshot(ctx, cx, &slug, "/").await
}

/// Render a public whiteboard snapshot. `base_href` is `/` for the canonical
/// `/w/<slug>` route, or the embed prefix (e.g. `/tenant_<id>/`) when served
/// via `?wb=<slug>` behind a tenant prefix — asset URLs are base-relative so
/// they keep working in both cases.
pub async fn render_snapshot(ctx: &AppContext, cx: &Cx, slug: &str, base_href: &str) -> Result<Response> {
    // `view!` expands to helpers taking `__cx: &Cx`, normally injected by the
    // `#[route]`/`#[component]` attributes — bind it manually here since this
    // shared helper carries no attribute.
    let __cx: &Cx = cx;
    let snap = match ctx.db.public_snapshot(slug).await {
        Ok(Some(s)) => s,
        _ => {
            return Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header("content-type", "text/html; charset=utf-8")
                .body(Body::from("<h1>Page not found</h1>"))
                .unwrap());
        }
    };

    let page_title = snap
        .body_md
        .lines()
        .find_map(|l| l.strip_prefix("# ").map(|s| s.trim().to_string()))
        .unwrap_or_else(|| "Shared Whiteboard Page".to_string());
    let favicon = "favicon.svg";
    let brand = "serverless v.0.1";

    // Base-relative asset URLs (see layout.rs): work at `/` and under a
    // tenant/embed prefix alike.
    let css_url = format!("?asset={}", bundled_asset(cx, STYLESHEET).name());
    let wb_js_url = format!("?asset={}", bundled_asset(cx, PUBLIC_WB_JS).name());
    let mermaid_url = format!("/_topcoat/assets/{}", bundled_asset(cx, MERMAID_JS).name());
    let marked_url = format!("/_topcoat/assets/{}", bundled_asset(cx, MARKED_JS).name());
    let highlight_url = format!("/_topcoat/assets/{}", bundled_asset(cx, HIGHLIGHT_JS).name());
    let katex_url = format!("/_topcoat/assets/{}", bundled_asset(cx, KATEX_JS).name());
    let katex_css_url = format!("?asset={}", bundled_asset(cx, KATEX_CSS).name());

    let pins = serde_json::from_str::<serde_json::Value>(&snap.pins)
        .unwrap_or_else(|_| serde_json::json!([]));
    let data = serde_json::json!({
        "body_md": snap.body_md,
        "pins": pins,
    });
    let data_json = serde_json::to_string(&data).unwrap_or_else(|_| "{}".to_string());
    let data_json = data_json.replace("</script", "<\\/script");

    let view = view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <base href=(base_href)>
                <title>(&page_title)</title>
                <meta name="description" content="Shared whiteboard page">
                <meta property="og:type" content="website">
                <meta property="og:site_name" content=(brand)>
                <meta property="og:title" content=(&page_title)>
                <link rel="icon" type="image/svg+xml" href=(favicon)>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href=(css_url)>
                <link rel="stylesheet" href=(katex_css_url)>
                <script>{ (Unescaped::new_unchecked(r#"(function(){
                    var saved = localStorage.getItem('theme');
                    var mq = window.matchMedia('(prefers-color-scheme: dark)');
                    if (saved) {
                        document.documentElement.setAttribute('data-theme', saved);
                    } else {
                        document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
                        mq.addEventListener('change', function(e) {
                            if (!localStorage.getItem('theme')) document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                        });
                    }
                })();"#)) }</script>
                { (Unescaped::new_unchecked({
                    let imports = serde_json::json!({
                        "marked": marked_url,
                        "highlight.js": highlight_url,
                        "katex": katex_url,
                        "mermaid": mermaid_url
                    });
                    let map = serde_json::json!({ "imports": imports });
                    format!(r#"<script type="importmap">{}</script><script type="module">import m from "{}"; window.mermaid = m.default || m; if (window.mermaid.initialize) {{ try {{ window.mermaid.initialize({{startOnLoad:false}}) }} catch(e) {{}} }}</script>"#, map, mermaid_url)
                })) }
            </head>
            <body class="flex flex-col min-h-screen" style="font-family: var(--font-sans); color: var(--color-text); background: var(--color-bg);">
                <div id="page-root" class="w-full mx-auto flex flex-col" style="max-width: 67.5rem; min-height: 100dvh; border-left: 1px solid var(--color-border-weak); border-right: 1px solid var(--color-border-weak);">
                    <header class="flex items-center justify-between px-6 py-4" style="border-bottom: 1px solid var(--color-border-weak);">
                        <a href="./" class="no-underline text-sm font-semibold" style="color: var(--color-text-strong);">(brand)</a>
                        <span class="text-xs" style="color: var(--color-text-weak);">"Shared whiteboard page"</span>
                    </header>
                    <main class="flex-1 flex flex-col min-h-0">
                        <div id="wb-root" class="chat-markdown" style="max-width: 860px; margin: 0 auto; width: 100%; padding: 28px 20px 0;"></div>
                        <div id="wb-pins" style="max-width: 860px; margin: 0 auto; width: 100%; padding: 0 20px 60px;"></div>
                    </main>
                </div>
                <script type="application/json" id="wb-data">(data_json)</script>
                <script type="module" src=(wb_js_url)></script>
            </body>
        </html>
    };

    Ok(view.into_response(cx)?)
}