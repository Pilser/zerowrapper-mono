# Test Plan — Whiteboard + Serverless without heavy Chromium or extension

## Constraint (from you)
- No heavy `chromium`/`node` in Firecracker VMs.
- No extension for end users.
- Still test what the agent just published (whiteboard page + serverless board) end-to-end, and collect JS/mermaid errors, **in the user's open tab**.

## Why CDP is not the path for you
- `Playwright MCP` → `CDP DOM.describeNode` → `click` works only when the **server** runs a headless Chromium. That’s the heavy VM you don’t want.
- Page JS (`whiteboard.wb` `<script>`) **cannot** call CDP — it’s a privileged browser protocol, only an extension or a server browser can use it. So we don’t use CDP from the page.

## What we *can* do — all with your existing stack (no new infra)

### 1. Agent controls the selectors (no CDP needed)
The agent generates the whiteboard HTML, so it gives every interactive element a stable `id`:

```html
<input id="title2">
<button id="submit-page2">
```

The in-page test script then does exactly what Playwright would, but with plain DOM APIs:

```js
document.getElementById('title2').value = 'Hello';
document.getElementById('title2').dispatchEvent(new Event('input', {bubbles:true}));
document.getElementById('submit-page2').click();
```

No `ref=e5`, no `DOM.describeNode` — the `id` *is* the exact reference. For free-form HTML the agent also generates, it can use `querySelector('[data-testid="submit"]')` or `getByText` polyfill, same as Playwright but without CDP.

### 2. In-page checks (JS + WASM) before/while testing
In the same `whiteboard.wb` or a linked `/files/*.js` (via `generate_file_urls`):

- **JS syntax:** `new Function(code)` or `acorn.parse(code)` — or WASM `oxc_parser` (`parser.wasm` ~80KB) for better `line:col` if you want it. Runs in the tab, no server.
- **Mermaid:** `mermaid.parse(code)` try/catch.
- **HTML/CSS:** `DOMParser` + `CSS.supports`.

All via `window.onerror`/`unhandledrejection`/`console.error` wrappers you already have.

### 3. New `inspect` MCP (CLI `inspect`, replaces old `wb check`/`b_collect`)

Old `check.js`+`b_collect`+`wb check` removed — new dedicated `inspect` provider (`crates/ch-web-ui` + `zw-mcp/src/inspect.rs`, `shared` DB, no `--session`):

```
inspect check js <code|/path>          # new Function / acorn-or-WASM oxc line:col
inspect check mermaid <code|/path>     # mermaid.parse
inspect check html <code|/path>        # DOMParser
inspect frontend-automation <steps.json> # was e2e — fill/click/check with exact ids
inspect webscreenshot [target]          # was snap — html2canvas(target,scale:2)
```

`inspect-reports` board (`whiteboard/serverless.db`, `id="inspect-reports"`, `shared`, drains 10m/60m, not `b_collect`) is the inbox. Every `report` does `fetch('/api/srv/inspect-reports/submit', {Authorization:'Bearer inspect-reports'})`.

### 4. How the agent triggers the open tab (no file creation, no CDP)
The tab is already `WS` (`handler.rs:64` ↔ `connection.js:33`). Agent does `ws.send({type:'frontend-automation', steps:[{action:'fill',target:'#title3',value:'Hi'},{action:'click',target:'#submit3'}]})` or `ws.send({type:'webscreenshot', target:'#whiteboard-body'})` or `ws.send({type:'check', kind:'js', code:'let x={'})` — front `check.js` runs `runE2E`/`checkJS`/`doSnap` with plain `document.getElementById`/`querySelector` on the stable `id`s the agent generated. No `ref=e5`, no `DOM.describeNode`.

### 5. Floating snap button — human vs agent (small, like whiteboard arrows)
- One `position:fixed` `34px` round (`whiteboard-arrow` style, `z-index:70`, `border:1px solid var(--color-border-weak)`, `box-shadow:0 2px 10px rgba(0,0,0,.18)`) at `bottom:16px; right:16px` (or `bottom:80px` when `#chat-input` visible, like `whiteboard.js:positionArrows`). Works on **chat** (`#chat-messages`), **whiteboard** (`#whiteboard-body`), **published** (`#wb-root`) — agent picks `target`.
- Click handler checks `event.isTrusted`:
  - **Human** (`isTrusted===true`): `html2canvas(target, {scale:2})` → `canvas.toBlob` → `fetch('/?api=upload')` → file lands in normal upload flow, preview goes to ` #attachments` / `file-input` area like the file picker, **user** clicks **Send** — image goes to chat as `![snap](/files/<hash>)` so they can type `fix this`.
  - **Agent** (`isTrusted===false`, via `ws` `webscreenshot` or `element.click()`): same `html2canvas` → `fetch('/?api=upload')` but server also writes the `png` to a **temp folder in the configured agent path** (`AGENTS_DIR`/`TOPCOAT_ASSETS_DIR` temp, e.g. `agents/craw/workspace/temp/snap-<ts>.png` via `zw` `cache_dir`). The `ws` response the agent gets is `{ok:true, url:'/files/<hash>', path:'/home/.../agents/craw/workspace/temp/snap-xxx.png', target}`, so the agent can `read` the file from `temp` and see it without waiting for the user.

### 6. Dependencies — baked into binary, no CDN, no `agents` write at runtime
- `html2canvas` + `acorn` (or `oxc_parser.wasm` + glue) **downloaded once** into `crates/ch-web-ui/assets/js/chat/` then `bun build` into `app.js`/`public-wb.js` — never `https://cdn...`, never `agents/craw/workspace/files/` at runtime. Same for `katex`/`mermaid`.
- Every page already loads `app.js`, so `inspect` works for any `target`.

### 7. What to add
- `crates/ch-web-ui/assets/js/chat/check.js` + `html2canvas.js` + `parser.wasm` + glue — bundled (no `agents` write). Works on **chat**, **whiteboard**, **published**.
- `inspect-reports` board (`shared`)
- `inspect` provider (`zw-mcp/src/inspect.rs`) with verbs above (reads `inspect-reports` + `stream_buffer`)

### Scope
Covers `publish`/`unpublish`, `mermaid`/`JS`, `serverless` live, and `snap` for any target. No Sentry, no `chrome-devtools-mcp` in the serving VM.
