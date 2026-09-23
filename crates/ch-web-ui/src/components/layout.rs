use topcoat::Result;
use topcoat::view::{view, Unescaped};
use topcoat::router::layout;
use topcoat::context::{Cx, app_context};
use topcoat::asset::{asset, bundled_asset};

use crate::context::AppContext;
use crate::components::whiteboard_panel::whiteboard_panel;
use crate::assets::STYLESHEET;
use crate::assets::STYLEX_CSS;
use crate::assets::MERMAID_JS;
use crate::assets::MARKED_JS;
use crate::assets::HIGHLIGHT_JS;
use crate::assets::KATEX_JS;
use crate::assets::KATEX_CSS;
use crate::assets::PDF_JS;
use crate::assets::PDF_WORKER_JS;
use crate::assets::DOCX_JS;
use crate::assets::XLSX_JS;
use crate::assets::PPTX_JS;
use crate::assets::JSZIP_JS;
use crate::assets::JSZIP_SHIM;

#[layout("/")]
pub async fn root_layout(cx: &Cx, slot: Result) -> Result {
    // Bare single-user page: no site title/brand/footer — static chrome only.
    let _ctx: &AppContext = app_context(cx);

    // Base-relative asset URLs so an embedded frontend (e.g. behind a tenant
    // prefix like /srv/<board>/) resolves them against the document base
    // instead of the host root (served by the RootDispatchLayer via ?asset=).
    let css_url = format!("?asset={}", bundled_asset(cx, STYLESHEET).name());
    // StyleX second sheet. ON: floating piles (think/tool cards) cut over
    // 2026-09-20 — their old styles.css rules were deleted, so the sheet is
    // required for them to render. Drawer stays on old CSS (reverted).
    // Tailwind first, StyleX second so StyleX wins without !important.
    const USE_STYLEX: bool = true;
    let stylex_url = format!("?asset={}", bundled_asset(cx, STYLEX_CSS).name());
    let stylex_link = if USE_STYLEX {
        format!(r#"<link rel="stylesheet" href="{stylex_url}">"#)
    } else {
        String::new()
    };
    let app_js_url = format!("?asset={}", bundled_asset(cx, asset!("assets/js/chat/app.js")).name());
    let mermaid_url = format!("/_topcoat/assets/{}", bundled_asset(cx, MERMAID_JS).name());
    let marked_url = format!("/_topcoat/assets/{}", bundled_asset(cx, MARKED_JS).name());
    let highlight_url = format!("/_topcoat/assets/{}", bundled_asset(cx, HIGHLIGHT_JS).name());
    let katex_url = format!("/_topcoat/assets/{}", bundled_asset(cx, KATEX_JS).name());
    let katex_css_url = format!("/_topcoat/assets/{}", bundled_asset(cx, KATEX_CSS).name());
    // File-viewer renderers (vendored dist). pdfjs + docx-preview are ESM,
    // resolved through the import map; pdf worker URL is exposed as a global;
    // xlsx + pptx are UMD and set window.XLSX / window.pptxPreview via a
    // classic script tag.
    let pdf_url = format!("/_topcoat/assets/{}", bundled_asset(cx, PDF_JS).name());
    let pdf_worker_url = format!("/_topcoat/assets/{}", bundled_asset(cx, PDF_WORKER_JS).name());
    let docx_url = format!("/_topcoat/assets/{}", bundled_asset(cx, DOCX_JS).name());
    let xlsx_url = format!("/_topcoat/assets/{}", bundled_asset(cx, XLSX_JS).name());
    let pptx_url = format!("/_topcoat/assets/{}", bundled_asset(cx, PPTX_JS).name());
    // jszip: UMD classic script + ESM shim (docx-preview imports 'jszip').
    let jszip_url = format!("/_topcoat/assets/{}", bundled_asset(cx, JSZIP_JS).name());
    let jszip_shim_url = format!("/_topcoat/assets/{}", bundled_asset(cx, JSZIP_SHIM).name());

    // Base href = the directory of the request path, so relative URLs resolve
    // correctly whether the page is served at `/` or under a tenant prefix.
    let req_path = topcoat::router::uri(cx).path().to_string();
    let base_href = if req_path.ends_with('/') {
        req_path.clone()
    } else {
        match req_path.rfind('/') {
            Some(idx) => req_path[..=idx].to_string(),
            None => "/".to_string(),
        }
    };

    view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <base href=(base_href)>
                <title>"chat"</title>
                <link rel="icon" type="image/svg+xml" href="/favicon.svg">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href=(css_url)>
                { (Unescaped::new_unchecked(stylex_link)) }
                <link rel="stylesheet" href=(katex_css_url)>
                <script>{ (Unescaped::new_unchecked(r#"(function(){
                    var saved = localStorage.getItem('theme');
                    var mq = window.matchMedia('(prefers-color-scheme: dark)');
                    if (saved) {
                        document.documentElement.setAttribute('data-theme', saved);
                    } else {
                        document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
                        mq.addEventListener('change', function(e) {
                            if (!localStorage.getItem('theme')) {
                                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                            }
                        });
                    }
                })();"#)) }</script>
            </head>
            <body class="app-body flex flex-col" style="height: 100dvh; overflow: hidden;">
                <main class="flex-1 flex flex-col min-h-0">
                    (slot?)
                </main>
                whiteboard_panel()

                { (Unescaped::new_unchecked({
                    let imports = serde_json::json!({
                        "marked": marked_url,
                        "highlight.js": highlight_url,
                        "katex": katex_url,
                        "mermaid": mermaid_url,
                        "pdfjs-dist": pdf_url,
                        "docx-preview": docx_url,
                        "jszip": jszip_shim_url
                    });
                    let map = serde_json::json!({ "imports": imports });
                    format!(r#"<script type="importmap">{}</script><script>window.__zwPdfWorker = "{}";</script><script src="{}"></script><script src="{}"></script><script src="{}"></script><script type="module">import m from "{}"; window.mermaid = m.default || m; if (window.mermaid.initialize) {{ try {{ window.mermaid.initialize({{startOnLoad:false}}) }} catch(e) {{}} }}</script>"#, map, pdf_worker_url, jszip_url, xlsx_url, pptx_url, mermaid_url)
                })) }
                <script type="module" src=(app_js_url)></script>
            </body>
        </html>
    }
}
