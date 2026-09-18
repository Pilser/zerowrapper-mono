# Stream Regression — whiteboard works, chat stream dead until refresh

**Date:** 2025-09-18  
**Commits that introduced it:** `21855b92f951d3ec246cee00188a5eb079ddde92` (whiteboard page decoupling + tenant links + history poll fallback) and `25e1abd9de980425eb4e204eb65f5a3ff4318f82` (B unified cache — session status, committed history + smart stream resume)  
**Current symptom (user):** `http://127.0.0.1:9092/` and `https://jerboapi.latiforge.com/tenant_ea8b1de2-8822-429a-83c7-1ea728a6d54b/` show `Page 1 of 1` empty in chat whiteboard, chat shows animation (`Thinking` / `typing-indicator active`) but no `chunk` content; when backend finishes `Done` the animation stops but no assistant bubble appears. After `Refresh` ( `GET /api/history?session_id=...` ) the whole turn appears at once via `history_snapshot` `messages[]`. Local `?wb=k4gjzhi` (snapshot `b_emyoe2pe0hld0000`) still lands because it is `public_wb.rs:14` `render_snapshot`, not `BoardUpdate` `state`.

**How to reproduce quickly**

1. `curl -s -X POST http://127.0.0.1:9092/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"manage_whiteboard","arguments":{"command":"wb list"}}}'` → `pages [1,2,3,4] active:1` (shared DB at `workspace/whiteboard/whiteboard.wb` 22821, `workspace/whiteboard/serverless.db`) — DB is correct.
2. Open `http://127.0.0.1:9092/` → `Expand whiteboard` → `Page 1 of 1` empty, `whiteboard-body` `innerHTML=""` (should be `Page 1 of 4` Guestbook).
3. Send chat `hello` → `typing-indicator active` + `turn-activity` `Thinking 151` appears, but `chat-messages` only has `message-row user`; `localStorage zerowrapper_lastSeq_<sid>` stays `null`, `curl /api/stream?session_id=<sid>&since=0` has `max_seq` growing (e.g. 2277, 3619) with `thinking`/`tool_call`, but `curl /api/history?session_id=<sid>` only shows `user` until `Done`, then after `Done` shows `user+assistant` — live `chunk` never rendered, only `history` on refresh.

**Root causes — what each commit broke**

### `25e1abd` — B unified cache (`crates/ch-web-ui/src/ws/handler.rs:92`, `zw-db/src/*`, `crates/ch-web-ui/assets/js/chat/*`)

* `handler.rs:92` `engine_history` was changed to prefer `live engine` vs `session file` but the new `history_snapshot` (`handler.rs:130` `db_history` + `history_snapshot`) became the source for `GET /api/history` (`crates/ch-web-ui/src/api/history.rs:22` and `crates/ch-web-ui/src/routes/root_dispatch.rs:69` `?api=history`). `run_embedded_turn` (`handler.rs:200` `set_session_processing` before `engine.lock().await`, `handler.rs:290` `insert_chat_message` for `user` eagerly and `assistant` at `Done`, `handler.rs:314` `set_session_idle`) now persists every turn to `chat_messages` (`zw-db/src/sessions.rs:109` `insert_chat_message`, `zw-db/src/migrations.rs:6` `chat_messages` + `zw-db/src/migrations.rs:252` `sessions status/active_turn_id`). `GET /api/history` now returns `history_snapshot` `{messages, status, running, max_seq, pending_asks}` (`handler.rs:130`), not just `engine_history`. This is correct for refresh, but the live path was left to `stream_buffer` `handler.rs:330` `mem_append` + `handler.rs:239` `buffer_event` (`stream_buffer.rs:14` `stream_buffer_append` + `zw-db/src/stream_buffer.rs:49` `replay`) + `connection.js:390` `resume` `since=getLastSeq`. The live `event_tx` → `ws_sender` (`handler.rs:560` `event_tx` + `ws.lock().await.send`) was not drained correctly when `TASKS` leaked (see below), so `chunk` stayed in `stream_buffer` and `history` until `fetchHistory` on refresh.

* `TASKS` leak (`handler.rs:324`): `run_embedded_turn` did `if tasks.get(sid).map(|(h, _)| h.is_finished()).unwrap_or(false) { remove }` **inside** the task — always `false`, so `TASKS` (`crates/ch-web-ui/src/ws/handler.rs:31` `TASKS: HashMap<String,(JoinHandle,AbortSlot)>`) never cleared, `agent_sessions` (`handler.rs:53` `agent_session_list`) stayed `running:true` forever, `history_snapshot` `status_eff` (`handler.rs:130`) stayed `processing`, and `connection.js:142` `handleMessage` `done` was gated by `hasPendingAsk()` / `pendingAskIds` (`connection.js:142` `deferDone`) and never called `handleDone` live — only `history` after `Done` + `set_session_idle` + `sweep_stale_processing` (`src/main.rs:83`).

* Frontend `connection.js:142` `handleMessage` dedup (`connection.js:145` `if seq <= getLastSeq(sid0) return; bumpSeqFrom`) + `messages.js:102` `fetchHistory` now returns `history_snapshot` with `status` and `pending_asks`, and `connection.js:390` `onOpen` does `fetchHistory().then(snap=>sendResume(snap))` with `snap.pending_asks` → `pendingAskIds` and `snap.status` → `startHttpPoll` (`connection.js:142` `httpPoll` `GET /api/stream?since=`). `streaming.js:32` `scheduleRender` uses `requestAnimationFrame` — headless `agent-browser` never fires `rAF`, so `chunk` stayed in `content` until `finalize` at `done`, but `done` was deferred, so nothing rendered live.

### `21855b9` — whiteboard page decoupling (`crates/ch-web-ui/assets/js/chat/whiteboard.js:205`, `crates/ch-web-ui/src/ws/handler.rs:570`, `zw-mcp/src/manage_whiteboard.rs:115`)

* `whiteboard.js:205` `sync()` now sends `base_url+href` so `handler.rs:570` `whiteboard_sync` can store `FRONTEND_BASES` (`handler.rs:12` `FRONTEND_BASES`) for `manage_whiteboard` `set-public` tenant link (`whiteboard.js:157` `pageBase()` + `publicUrl` `?wb=` vs `/w/`). `handler.rs:570` `whiteboard_sync` correctly stores, but `whiteboard.js:265` `setBoard` was changed to preserve `prevNo` (`whiteboard.js:277` `prevNo = currentState.pages[currentPage].page_no`) and skip re-render when `lastBodyHash` unchanged (`whiteboard.js:294` `if lastPageNo===curNo && lastBodyHash===curHash && pages.length===window.__wbPrevLen return`). On first `BoardUpdate` (`handler.rs:570` `whiteboard_update` `state` with `pages[1,2,3,4] active:1`) `currentState` is `null`, so `prevNo` is `null` → `idx=findIndex(active_page)` → `0`, `currentPage=0`, but `lastPageNo` is `null` so not skipped, `renderCurrent` should show `Page 1 of 4` Guestbook — yet `whiteboard.js:229` `renderCurrent` fallback `if (!currentState.pages.length)` rendered `Page 1 of 1` empty when `currentState` was `null` due to `setBoard` being called with `data.state` `undefined` (tenant `base href="/tenant_.../"` `wsPath="/tenant/.../ws"` mismatched `crates/ch-web-ui/src/routes/ws.rs:9` `GET /ws` vs `crates/ch-web-ui/src/routes/root_dispatch.rs:69` `?ws=1`, so `whiteboard_sync` never returned `BoardState` for tenant, only `pages 1` empty). Local `http://127.0.0.1:9092/` also showed `1 of 1` empty after the same `setBoard` skip logic hid the first `BoardUpdate`.

* `check.js:4` `report` now uses `pageBase()` + `Authorization: Bearer inspect-reports` (`crates/ch-web-ui/assets/js/chat/check.js:4` `srvReportUrl()`), correct for tenant.

**What to fix (minimal)**

* `crates/ch-web-ui/assets/js/chat/connection.js:394` `wsPath` — use `baseHref+"?ws=1"` for `base != "/"` so tenant `wss://.../tenant/.../?ws=1` hits `root_dispatch.rs:69` `handle_ws_connection` and `whiteboard_sync` returns 6 pages; keep `"/ws"` for standalone.
* `crates/ch-web-ui/src/components/layout.rs:30` `katex_css_url` — use `/_topcoat/assets/` not `?asset=` so `fonts/KaTeX_...` resolves to `/_topcoat/assets/fonts/` not `/tenant/.../fonts/` (404 `katex.min-717bc9ae...css` `fonts/`).
* `crates/ch-web-ui/assets/js/chat/whiteboard.js:265` `setBoard` — restore original `currentState=data.state; idx=findIndex(active_page); renderCurrent()` (remove `lastPageNo` skip) so first `BoardUpdate` shows `Page 1 of 4/6`.
* `crates/ch-web-ui/src/ws/handler.rs:324` `TASKS` — `Arc::ptr_eq(stored_slot, &abort_slot)` not `is_finished()` inside task, so `running:true` clears on `Done` and `history_snapshot` `status` flips `processing→idle`.
* `crates/ch-web-ui/assets/js/chat/streaming.js:32` `scheduleRender` — `rAF` + `50ms setTimeout` fallback so `chunk` renders headless; `connection.js:142` `handleMessage` `done` not deferred when `pendingAskIds` empty.

**How to run a new CI binary+assets in tmux so you can test (no `agent-browser` spam)**

```sh
# 1. get the green run's paired artifacts (same hash, same run)
gh run list --repo Pilser/zerowrapper-mono --limit 1  # pick green 352...  e.g. 352...  a441fe6
rm -rf /tmp/zw-new && mkdir -p /tmp/zw-new
gh run download <runId> -n zw-linux-x86_64 -D /tmp/zw-new/bin
gh run download <runId> -n zw-assets -D /tmp/zw-new/assets
ls /tmp/zw-new/bin/zw && ls /tmp/zw-new/assets/app-*.js | head -1 | xargs -n1 basename
md5sum /tmp/zw-new/bin/zw | cut -c1-8; cat /tmp/zw-new/assets/manifest.toml | grep -A1 'app-'

# 2. deploy paired to the host you test (`deployment/zerowrapper-mono` is the `127.0.0.1:9092` you gave)
cp /tmp/zw-new/bin/zw /home/vox/.AAAPROJECTS/FPE/AI-plan/deployment/zerowrapper-mono/zwnew
mv /home/vox/.AAAPROJECTS/FPE/AI-plan/deployment/zerowrapper-mono/zwnew /home/vox/.AAAPROJECTS/FPE/AI-plan/deployment/zerowrapper-mono/zw && chmod +x /home/vox/.AAAPROJECTS/FPE/AI-plan/deployment/zerowrapper-mono/zw
rm -rf /home/vox/.AAAPROJECTS/FPE/AI-plan/deployment/zerowrapper-mono/assets && cp -r /tmp/zw-new/assets /home/vox/.AAAPROJECTS/FPE/AI-plan/deployment/zerowrapper-mono/assets

# 3. put the same pair in jerboa (tenant) if you test tenant
cp /tmp/zw-new/bin/zw /home/vox/.AAAPROJECTS/FPE/AI-plan/jerboa/binaries/zw && chmod +x /home/vox/.AAAPROJECTS/FPE/AI-plan/jerboa/binaries/zw
rm -rf /home/vox/.AAAPROJECTS/FPE/AI-plan/jerboa/binaries/zw-assets && cp -r /tmp/zw-new/assets /home/vox/.AAAPROJECTS/FPE/AI-plan/jerboa/binaries/zw-assets
# jerboa/binaries/assets is not used (only zw-assets), remove if present:
rm -rf /home/vox/.AAAPROJECTS/FPE/AI-plan/jerboa/binaries/assets

# 4. restart the host wrapper in tmux (not nohup, not docker) so whiteboard at 9092 shows
# kill any docker zw on 9092 if it squats (the 9092 you gave is host, not docker 9090/9091)
pkill -f "deployment/zerowrapper-mono/zw" || pkill -9 zw
tmux -S /tmp/tmux-1000/default new -d -s zw  # create detached
tmux -S /tmp/tmux-1000/default send-keys -t zw "cd /home/vox/.AAAPROJECTS/FPE/AI-plan/deployment/zerowrapper-mono" Enter
tmux -S /tmp/tmux-1000/default send-keys -t zw "set -a; source mono.env; set +a" Enter
tmux -S /tmp/tmux-1000/default send-keys -t zw "cd \"\$ZW_WORKDIR\" && exec /home/vox/.AAAPROJECTS/FPE/AI-plan/deployment/zerowrapper-mono/zw" Enter
sleep 4; curl -s http://127.0.0.1:9092/health | head -c 200; echo ok; curl -s http://127.0.0.1:9092/ | grep -o 'app-[^.]*\.js' | head -1
tmux -S /tmp/tmux-1000/default capture-pane -t zw -p | tail -20
# now open http://127.0.0.1:9092/ and https://jerboapi.latiforge.com/tenant_ea8b1de2-8822-429a-83c7-1ea728a6d54b/ — chat should stream live (Thinking → chunk → Done) without refresh, whiteboard Expand should show Page 1 of 4/6 Guestbook, not 1 of 1 empty, and tenant ?wb=k4gjzhi still lands.
```

**Files to read for a clean investigation (no `agent-browser` needed)**

* `crates/ch-web-ui/src/ws/handler.rs:92` `engine_history` vs `crates/ch-web-ui/src/ws/handler.rs:130` `history_snapshot` + `crates/ch-web-ui/src/ws/handler.rs:200` `run_embedded_turn` + `crates/ch-web-ui/src/ws/handler.rs:324` `TASKS` + `crates/ch-web-ui/src/ws/handler.rs:570` `whiteboard_sync` + `crates/ch-web-ui/src/ws/handler.rs:12` `FRONTEND_BASES`
* `zw-db/src/migrations.rs:6` `SYSTEM_SCHEMA` `sessions status/active_turn_id` + `zw-db/src/sessions.rs:109` `insert_chat_message` + `zw-db/src/stream_buffer.rs:14` `stream_buffer`
* `crates/ch-web-ui/assets/js/chat/connection.js:142` `handleMessage` (`whiteboard_update` `thinking` `chunk` `done` `ask_requested`) + `crates/ch-web-ui/assets/js/chat/connection.js:390` `connect` `wsPath`
* `crates/ch-web-ui/assets/js/chat/streaming.js:32` `scheduleRender` + `crates/ch-web-ui/assets/js/chat/whiteboard.js:205` `sync` + `crates/ch-web-ui/assets/js/chat/whiteboard.js:265` `setBoard` + `crates/ch-web-ui/assets/js/chat/whiteboard-render.js:17` `renderBoard`
* `crates/ch-web-ui/src/components/layout.rs:30` `katex_css_url` + `crates/ch-web-ui/src/routes/ws.rs:9` `GET /ws` + `crates/ch-web-ui/src/routes/root_dispatch.rs:69` `?ws=1`
