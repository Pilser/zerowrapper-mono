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
// File-viewer renderers, vendored dist files (served as static assets, no
// bun install at build — same pattern as mermaid/katex).
pub static PDF_JS: Asset = asset!("assets/js/chat/pdf.min.mjs");
pub static PDF_WORKER_JS: Asset = asset!("assets/js/chat/pdf.worker.min.mjs");
pub static DOCX_JS: Asset = asset!("assets/js/chat/docx-preview.mjs");
pub static XLSX_JS: Asset = asset!("assets/js/chat/xlsx.full.min.js");
pub static PPTX_JS: Asset = asset!("assets/js/chat/pptx-preview.umd.js");
/// jszip is UMD-only; loaded as a classic script and re-exported to ESM via
/// the shim so docx-preview's `import JSZip from 'jszip'` resolves.
pub static JSZIP_JS: Asset = asset!("assets/js/chat/jszip.min.js");
pub static JSZIP_SHIM: Asset = asset!("assets/js/chat/jszip.shim.mjs");
