# Mermaid Loading Issue — Frontend "mermaid not loaded"

## Problem
When `inspect whiteboard-check` or `inspect frontend-automation` sends a WS message to the browser tab, the `checkMermaid()` function in `check.js` reports "mermaid not loaded" even though:
- The importmap correctly maps `mermaid` to `/_topcoat/assets/mermaid-10b6293bcdebeead.js`
- A pre-load inline `<script type="module">` in `layout.rs` tries to `import m from mermaid` and assign to `window.mermaid`
- The mermaid.js file is valid ES module (3.4MB bundled via bun from mermaid@11.4.1)

## Root Cause (suspected)
The `import('mermaid')` dynamic import inside `check.js` fails because:
1. Dynamic `import()` in a module script may not resolve the importmap specifier in some contexts
2. The inline pre-load script (`import m from mermaid; window.mermaid = m.default || m`) runs as a separate module — it may not have executed yet when the WS-triggered check runs
3. The `window.mermaid` assignment from the pre-load script may not persist across different module evaluation contexts

## What was tried
- `import('mermaid')` with importmap → fails with "Failed to resolve module specifier"
- `import('/_topcoat/assets/mermaid-10b6293bcdebeead.js')` (full path) → fails similarly
- Pre-load inline script to set `window.mermaid` before app.js loads
- Multiple fallback strategies in `ensureMermaid()` (importmap, full path, known paths)
- `serde_json::json!` to generate the importmap (fixed the JSON parsing error, but mermaid still not loaded)

## Current state
- Importmap JSON is valid and served correctly
- Mermaid file is bundled locally at `/_topcoat/assets/mermaid-10b6293bcdebeead.js`
- `window.mermaid` is NOT available when WS-triggered checks run
- Server-side `inspect check mermaid` is a stub (always returns ok:true)

## Fix needed (future)
- Either:
  a. Load mermaid synchronously via a regular `<script>` tag (not module) that exposes `window.mermaid` globally — but mermaid@11 is ESM only
  b. Or load mermaid in `app-entry.js` directly (not dynamic import) and expose on `window`
  c. Or use mermaid@10 which has a UMD/global build
  d. Or delay the WS-triggered mermaid check until after the page's `load` event fires (the pre-load module has had time to run)

## Files involved
- `crates/ch-web-ui/src/components/layout.rs:79-88` — importmap + mermaid pre-load script
- `crates/ch-web-ui/src/routes/public_wb.rs:97-106` — same for public whiteboard
- `crates/ch-web-ui/assets/js/chat/check.js:80-109` — `ensureMermaid()` + `checkMermaid()`
- `crates/ch-web-ui/assets/js/chat/connection.js:148-167` — `whiteboard_check` WS handler
