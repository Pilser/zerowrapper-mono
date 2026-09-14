# Reliability Improvements — zerowrapper

This doc covers the reliability fixes landed in Sep 2026 before the whiteboard / serverless / templates work is hardened. All changes are deployed via `build-deploy.md` (CI builds binary + asset bundle as a paired set; never mix versions).

## 1. Chat scroll — not fighting the user

**Problem:** `body { overflow:hidden; height:100dvh }` with no scroll container. `#chat-messages` grew unbounded, pushing the input off-screen. Every new `chunk` did unconditional `scrollIntoView`, yanking the view while reading history.

**Fix:** `crates/ch-web-ui/src/components/chat_section.rs:10` — `#chat-messages` is now the scroll container (`flex:1`, `min-height:0`, `overflow-y:auto`), bottom bar is `flex-shrink:0` (not `sticky`). New `crates/ch-web-ui/assets/js/chat/scroll.js` — `autoScroll()` only sticks when already within ~140px of bottom; `messages.js:96`/`streaming.js:45`/`tool-calls.js` use it. History load does `scrollToBottom(false)`.

**Result:** Fill the chat, you stay at bottom; scroll up, live updates don't yank you.

## 2. Whiteboard + serverless — session-proof shared layout

**Problem:** `whiteboard.wb` and `<sid>.db` lived under `workspace/sessions/<sid>/`. Switching the chat session orphaned boards/apps.

**Fix:** Single shared `workspace/whiteboard/whiteboard.wb` (`zw-whiteboard/src/lib.rs:440` `session_path`) and single `workspace/whiteboard/serverless.db` (`zw-db/src/session_store.rs:24` `SHARED_DB_FILE`, `SHARED_KEY="shared"`). All DB rows stay keyed by `session_id` but the file is shared. First open auto-migrates newest legacy copy + WAL/SHM sidecars. Board files under `whiteboard/apps/<board>/files` (`zw-db/src/serverless.rs:1046` `srv_session_dir`) with legacy `sessions/<owner>/apps/...` fallback on read. Docs `serverless-engine-features.md:§19,§22` updated.

**Result:** Change chat session → same board, same apps, same files.

## 3. Base-aware share links (tenant embeds)

**Problem:** Whiteboard share created `origin + /w/<slug>` even when the page was loaded under `http://host/tenant_<id>/`, 404 there.

**Fix:** Frontend `crates/ch-web-ui/assets/js/chat/whiteboard.js:122` `pageBase()` reads `<base href>`; at `/` → `/w/<slug>`, under a prefix → `<prefix>/?wb=<slug>`. `crates/ch-web-ui/src/routes/root_dispatch.rs:84` serves `?wb=<slug>` on any path; `crates/ch-web-ui/src/routes/public_wb.rs:14` `render_snapshot` renders with `<base href>` and base-relative `?asset=` URLs so CSS/JS load inside embeds.

## 4. Markdown readability

- Centered reading column for assistant replies: `crates/ch-web-ui/styles.css` — ` #chat-messages > .message-row.assistant .msg-content { max-width:64rem }` with `align-items:center` on the row, text stays left-aligned so heading/paragraph hierarchy is kept. Wider than the old `54rem` for long sentences.
- Bullets restored (Tailwind preflight stripped them): neon-blue SVG bullets (`ul>li::before` mask with `var(--color-border)`), hollow/square per nest, neon ordered markers, task-list checkboxes — `styles.css: ~230`.
- Headers `h1–h4` slightly larger, `h5/h6` added.
- `==highlight==` (`mark`): `styles.css` — solid darker orange per theme (was translucent, invisible on black). Parser: `crates/ch-web-ui/assets/js/chat/markdown.js` `markInline` extension (verified on marked 18).
- Footnotes `[^n]` + code colors + callout cards `> [!NOTE|TIP|WARNING|CAUTION|IMPORTANT]` — same `markdown.js` extensions + `styles.css` `.callout`/`.footnotes`/`.hljs-*`.

## 5. Turn activity fold — Thinking / Actions

Replaced per-call pills with one stacked fold per assistant turn: `crates/ch-web-ui/assets/js/chat/activity.js`. Two rows — `Thinking` and `Actions` (tool calls labeled actions) — each with a live count badge, pulsing dot while streaming, quiet receipt on `done` (`Thought · 3`, `Actions · 2 ✓`). Manual toggle pins open. `streaming.js:flush()` keeps the fold open across tool calls; only final `finalize()` settles it.

## 6. Code colors + script safety

Code was tagged `hljs-*` by `highlight.js` but no theme CSS was ever loaded → plain white. Added theme-aware palettes (`styles.css: hljs-*`, `mark`, `pre` background/border) and `markdown.js:executeScripts` now pre-validates classic scripts and leaves broken ones inert instead of `SyntaxError: '' string literal...` from a `''` spanning a line break.

## 7. Cancel button — actually cancelable

**Problem:** `tool_call` did `finalizeIfActive → finalize → onFinalize(showSendIcon)` and hid the red stop button mid-tools; `hidden` vs `style.display` fought Tailwind.

**Fix:** `streaming.js:flush()` for tool-call path (no icon toggle, no `finishTurn`), `connection.js:56` uses it, `main.js:71` toggles `hidden` class via `classList`, `handleCancel` does `sendCancel + streaming.cancel()`, and `connection.js:67` `error`/`onClose` handling hides typing and restores the button. Cancel now stays red from send until `done`/`error`/explicit cancel.

## 8. WebSocket resume — hybrid memory + DB buffer (A+B)

**Problem:** Network blip while streaming caused frontend to send `cancel` and `fetchHistory`, wiping the just-sent user message + partial stream. Agent still produced deltas server-side but they were lost.

**Fix (A+B hybrid, ephemeral — NOT session storage):**
- `A`: disconnect is local-only; server keeps streaming (`consumeStream` path) so `onFinish` persists via agent DB. Agent DB remains source of truth for `messages.js:fetchHistory` on first connect.
- `B`: `zw-db/src/stream_buffer.rs` + `zw-db/src/migrations.rs:102` `stream_buffer(session_id, seq, type, payload)` in the system DB (`data/zerowrapper.db`) + `crates/ch-web-ui/src/ws/handler.rs:12` `MEM_BUFFER` (500/seq, memory). Every live `StreamEvent` is tagged `seq` and written through `handler.rs:310` before sending. Client `crates/ch-web-ui/assets/js/chat/connection.js:12` tracks `lastSeq` per `session_id` (`zerowrapper_lastSeq_<sid>`) and on `network.js` reconnect sends `{type:resume, session_id, since}`; handler `handler.rs:182` replays `memory+DB` `seq>since` sorted, then `resumed` ack.
- Drain: `crates/ch-web-ui/src/ttl_sweeper.rs:11` calls `stream_buffer_sweep()` — `DELETE` 10 min after terminal `done/turn_complete/error` per session, and `60 min` orphan sweep for server-went-off mid-stream. Memory bounded to 500.

**Preserved:** First-connect history loading (`get_session_messages` via zeroclaw) unchanged; this buffer is only replay for in-flight deltas and is drained, never used as durable history.

## 9. Deployment pairing

`build-deploy.md` — CI (`.github/workflows/ci.yml`) bundles frontend (`bun build`) before `cargo build` so the binary embeds the fresh `app.js` hash. Artifacts `zw` and `zw-assets` must be deployed together (`deployment/zerowrapper-mono/zw` + `assets/`), verified `diff -r` and manifest `id/hash`.

## What to test next

- Whiteboard / serverless / templates reliability (isolated boards, version `tpl@ver`, clone/update/commit, file uploads).
- Refresh mid-stream, kill WS, deploy `zw` mid-stream — expect no vanished messages, resume replay, then normal history.
