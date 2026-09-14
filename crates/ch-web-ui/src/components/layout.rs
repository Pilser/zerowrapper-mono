use topcoat::Result;
use topcoat::view::{view, Unescaped};
use topcoat::router::layout;
use topcoat::context::{Cx, app_context};
use topcoat::asset::{asset, bundled_asset};

use crate::context::AppContext;
use crate::components::whiteboard_panel::whiteboard_panel;
use crate::assets::STYLESHEET;
use crate::assets::MERMAID_JS;
use crate::assets::MARKED_JS;
use crate::assets::HIGHLIGHT_JS;
use crate::assets::KATEX_JS;
use crate::assets::KATEX_CSS;

#[layout("/")]
pub async fn root_layout(cx: &Cx, slot: Result) -> Result {
    // Bare single-user page: no site title/brand/footer — static chrome only.
    let ctx: &AppContext = app_context(cx);

    // Base-relative asset URLs so an embedded frontend (e.g. behind a tenant
    // prefix like /srv/<board>/) resolves them against the document base
    // instead of the host root (served by the RootDispatchLayer via ?asset=).
    let css_url = format!("?asset={}", bundled_asset(cx, STYLESHEET).name());
    let app_js_url = format!("?asset={}", bundled_asset(cx, asset!("assets/js/chat/app.js")).name());
    let mermaid_url = format!("/_topcoat/assets/{}", bundled_asset(cx, MERMAID_JS).name());
    let marked_url = format!("/_topcoat/assets/{}", bundled_asset(cx, MARKED_JS).name());
    let highlight_url = format!("/_topcoat/assets/{}", bundled_asset(cx, HIGHLIGHT_JS).name());
    let katex_url = format!("/_topcoat/assets/{}", bundled_asset(cx, KATEX_JS).name());
    let katex_css_url = format!("?asset={}", bundled_asset(cx, KATEX_CSS).name());

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
            <body class="flex flex-col" style="font-family: var(--font-sans); color: var(--color-text); background: var(--color-bg); height: 100dvh; overflow: hidden;">
                <main class="flex-1 flex flex-col min-h-0">
                    (slot?)
                </main>
                whiteboard_panel()
                <script>{ (Unescaped::new_unchecked(format!("window.ZW_AGENT = \"{}\";", ctx.agent))) }</script>
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
                <script type="module" src=(app_js_url)></script>
            </body>
        </html>
    }
}
