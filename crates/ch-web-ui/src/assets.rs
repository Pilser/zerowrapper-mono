use topcoat::asset::Asset;
use topcoat::asset::asset;
use topcoat::tailwind::stylesheet;

pub static STYLESHEET: Asset = stylesheet!();
/// StyleX second sheet (Phase 0 probe). File is emitted by
/// `assets/js/chat/build.mjs` (local only for now). Linked behind the
/// `USE_STYLEX` switch in `components/layout.rs`, OFF by default.
pub static STYLEX_CSS: Asset = asset!("assets/js/chat/stylex.css");
pub static PUBLIC_WB_JS: Asset = asset!("assets/js/chat/public-wb.js");
pub static MERMAID_JS: Asset = asset!("assets/js/chat/mermaid.js");
pub static MARKED_JS: Asset = asset!("assets/js/chat/marked.js");
pub static HIGHLIGHT_JS: Asset = asset!("assets/js/chat/highlight.min.js");
pub static KATEX_JS: Asset = asset!("assets/js/chat/katex.mjs");
pub static KATEX_CSS: Asset = asset!("assets/js/chat/katex.min.css");
