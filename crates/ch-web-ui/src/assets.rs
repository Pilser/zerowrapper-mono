use topcoat::asset::Asset;
use topcoat::asset::asset;
use topcoat::tailwind::stylesheet;

pub static STYLESHEET: Asset = stylesheet!();
pub static PUBLIC_WB_JS: Asset = asset!("assets/js/chat/public-wb.js");
pub static MERMAID_JS: Asset = asset!("assets/js/chat/mermaid.js");
