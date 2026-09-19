import * as network from './network.js'
import { els } from './dom.js'
import { state as authState, saveToStorage } from './auth.js'
import { fetchHistory, addMessage, abortHistoryFetch, upsertAssistantTurn } from './messages.js'
import * as streaming from './streaming.js'
import * as toolCalls from './tool-calls.js'
import * as whiteboard from './whiteboard.js'

export let onStateChange = null
export function setOnStateChange(cb) { onStateChange = cb }

function setHint(state) {
  if (!els.hint) return
  const fallback = els.hintText ? (els.hintText.dataset.fallback || els.hintText.textContent) : ''
  switch (state) {
    case network.State.CONNECTING:
      els.hint.style.display = 'flex'
      if (els.hintText) els.hintText.textContent = 'Connecting to backend…'
      if (els.chatRefreshBtn) els.chatRefreshBtn.classList.add('hidden')
      break
    case network.State.CONNECTED:
      els.hint.style.display = 'none'
      break
    default:
      els.hint.style.display = 'flex'
      if (els.hintText) els.hintText.textContent = fallback
      if (els.chatRefreshBtn) els.chatRefreshBtn.classList.remove('hidden')
  }
}

network.on('stateChange', setHint)

function lastSeqKey(sid) { return 'zerowrapper_lastSeq_' + (sid || '') }
function getLastSeq(sid) {
  const v = localStorage.getItem(lastSeqKey(sid))
  const n = v ? parseInt(v, 10) : 0
  return isNaN(n) ? 0 : n
}
function setLastSeq(sid, seq) {
  if (!sid || !seq) return
  const cur = getLastSeq(sid)
  if (seq > cur) localStorage.setItem(lastSeqKey(sid), String(seq))
}
// Reconcile the cursor with the server's authoritative max_seq. Used when the
// server buffer rewound (swept/restarted) so a stale high cursor would silently
// drop every live event. `seq` is 0 when the buffer is empty.
function resetLastSeq(sid, seq) {
  if (!sid) return
  const n = Number.isFinite(seq) && seq > 0 ? seq : 0
  localStorage.setItem(lastSeqKey(sid), String(n))
}
function reconcileCursor(sid, maxSeq) {
  if (!sid || typeof maxSeq !== 'number') return
  if (maxSeq < getLastSeq(sid)) resetLastSeq(sid, maxSeq)
}
function bumpSeqFrom(data) {
  const seq = data && typeof data.seq === 'number' ? data.seq : 0
  const sid = data && data.session_id ? data.session_id : authState.sessionId
  if (seq) setLastSeq(sid, seq)
}

// B: smart stream — Done is gated while an ask is pending (otherwise the UI
// finalizes before the post-answer continuation). HTTP poll is the smart
// fallback when WS drops while `processing`: replay `stream_buffer` via REST
// until WS resumes, so a refresh mid-turn never loses the tail.
let pendingAskIds = new Set()
let deferredDone = null
let httpPollTimer = null
let httpPollInFlight = false

function isAskDrawerOpen() {
  try { return !!(els.askDrawer && els.askDrawer.classList.contains('open')) } catch { return false }
}
function hasPendingAsk() {
  return pendingAskIds.size > 0 || isAskDrawerOpen()
}
function deferDone(data) {
  deferredDone = data
  console.log('[stream] Done deferred while ask pending', data.turn_id || '')
}
function clearDeferredDone() {
  deferredDone = null
}
try {
  window.addEventListener('askResolved', (e) => {
    const id = e && e.detail && e.detail.ask_id
    if (id) pendingAskIds.delete(String(id))
    else pendingAskIds.clear()
    // If a Done was deferred waiting for this ask, keep the turn open
    // and let the engine's continuation chunks + final Done close it. The
    // stale deferred Done is dropped — the next true terminal closes it.
    if (deferredDone && !hasPendingAsk()) {
      console.log('[stream] ask resolved — dropping stale deferred Done, waiting for continuation Done')
      deferredDone = null
    }
  })
} catch {}

function startHttpPoll() {
  if (httpPollTimer) return
  console.log('[stream] HTTP poll fallback armed')
  httpPollTimer = window.setInterval(async () => {
    try {
      const sid = authState.sessionId || localStorage.getItem('zerowrapper_session') || ''
      if (!sid) return
      const since = getLastSeq(sid)
      let data = null
      for (const url of ['/api/stream?session_id=' + encodeURIComponent(sid) + '&since=' + since, '?api=stream&session_id=' + encodeURIComponent(sid) + '&since=' + since]) {
        try {
          const r = await fetch(url)
          if (!r.ok) continue
          data = await r.json().catch(() => null)
          if (data) break
        } catch {}
      }
      if (!data || !Array.isArray(data.events)) return
      // Update status-driven UI hint
      if (data.status === 'idle' && data.events.length === 0) {
        // Processing finished and we caught up — stop polling, let WS drive
        if (network.getState() === network.State.CONNECTED) stopHttpPoll()
        // Also clear a deferred Done if we were waiting for this idle flip
        if (deferredDone && !hasPendingAsk()) {
          // No more continuation expected; finalize the deferred Done now
          const d = deferredDone
          deferredDone = null
          const tid = d.turn_id || ''
          let replaced = false
          if (tid) { try { replaced = upsertAssistantTurn(tid, d.content || '') } catch {} }
          if (replaced) streaming.dropPartial()
          else streaming.handleDone(d.content, tid)
          if (onStateChange) onStateChange('done')
        }
        return
      }
      if (httpPollInFlight) return
      httpPollInFlight = true
      for (const ev of data.events) {
        // Feed through the same handler as live WS (seq bumps, dedup intact)
        try { handleMessage({ data: JSON.stringify(ev) }) } catch {}
      }
      httpPollInFlight = false
      // If WS is back and we drained, stop poll — resume handles the rest
      if (network.getState() === network.State.CONNECTED && data.events.length === 0 && data.status !== 'processing') stopHttpPoll()
    } catch { httpPollInFlight = false }
  }, 3000)
}
function stopHttpPoll() {
  if (!httpPollTimer) return
  window.clearInterval(httpPollTimer)
  httpPollTimer = null
  console.log('[stream] HTTP poll fallback stopped')
}

function handleMessage(e) {
  try {
    const data = JSON.parse(e.data)
    // B: dedup by seq so WS resume + HTTP poll overlap never doubles chunks
    if (data && typeof data.seq === 'number' && data.seq > 0) {
      const sid0 = data.session_id || authState.sessionId || localStorage.getItem('zerowrapper_session') || ''
      if (data.seq <= getLastSeq(sid0)) return
      bumpSeqFrom(data)
    } else if (data && typeof data.seq === 'number') bumpSeqFrom(data)
    switch (data.type) {

      case 'whiteboard_update':
        whiteboard.setBoard(data)
        break
      case 'resumed':
        // Server ack of the replay window. If the buffer rewound below our
        // cursor, resync to the server's max so future live events pass dedup.
        reconcileCursor(data.session_id || authState.sessionId, data.max_seq)
        break
      case 'thinking':
        streaming.handleThinking(data.content)
        break
      case 'chunk':
        streaming.handleChunk(data.content)
        break
      case 'chunk_reset':
        // Engine discarded its buffer (retry): drop our partial row too,
        // or the restarted text appends to the old and doubles.
        streaming.reset()
        break
      case 'tool_call':
        streaming.flush()
        toolCalls.handleToolCall(data.tool_call_id, data.name, data.args)
        break
      case 'tool_result':
        toolCalls.handleToolResult(data.tool_call_id, data.name, data.output)
        break
      case 'done': {
        // B: smart gate — if an ask is still pending, the engine hasn't
        // really finished this turn (it will continue after the human
        // answers). Defer finalizing so post-answer chunks still render as
        // a continuation instead of freezing the chat.
        if (hasPendingAsk()) { deferDone(data); break }
        // Turn-keyed upsert: a history row for this turn (rendered from a
        // reconnect fetch) wins — drop our partial and update it instead of
        // appending a second row. Fresh turns finalize normally.
        const tid = data.turn_id || ''
        let replaced = false
        if (tid) {
          try { replaced = upsertAssistantTurn(tid, data.content || '') } catch {}
        }
        if (replaced) streaming.dropPartial()
        else streaming.handleDone(data.content, tid)
        clearDeferredDone()
        stopHttpPoll()
        if (onStateChange) onStateChange('done')
        break
      }
      case 'error':
        streaming.cancel()
        addMessage('error', data.message || data.error || 'Unknown error')
        if (onStateChange) onStateChange('error')
        break
      case 'agent_status':
        if (els.agentBanner) {
          if (data.online) els.agentBanner.classList.add('hidden')
          else els.agentBanner.classList.remove('hidden')
        }
        break
      case 'ask_requested': {
        // B: track pending ask so `Done` can be deferred; also show typing
        // for the continuation that will arrive after the human answers.
        try { if (data.ask_id) pendingAskIds.add(String(data.ask_id)) } catch {}
        // While an ask is open the turn is still logically running — keep
        // the cancel window meaningful and avoid finalizing early.
        try { streaming.showTyping() } catch {}
        // The native ask_user tool needs a human: open the right drawer.
        // Answers travel via REST, so a dropped socket never strands a turn.
        try {
          import('./ask-drawer.js').then((m) => {
            if (m && m.openWith) {
              m.openWith({
                ask_id: data.ask_id || '',
                session_id: data.session_id || authState.sessionId,
                questions: data.questions || [],
                kind: data.kind || 'model',
              })
            }
          }).catch(() => {})
        } catch {}
        break
      }
      case 'snap':
      case 'webscreenshot': {
        // Agent-triggered webscreenshot via WS: {type:'webscreenshot', target:'#whiteboard-body'} — agent (isTrusted false) path writes to temp
        try {
          const sel = data.target || data.selector || '#whiteboard-body'
          const btn = document.getElementById('snap')
          if (btn) btn.dataset.target = sel
          import('./check.js').then(async m => {
            const res = await m.doSnap(sel)
            if (res && res.ok && res.blob) {
              try {
                const r2 = await fetch('/api/inspect/snap', { method: 'POST', headers: { 'X-Filename': 'snap.png', 'X-Target': sel }, body: res.blob })
                const data2 = await r2.json().catch(()=>({}))
                const payload = { type: 'webscreenshot_result', ok: true, url: data2.url || res.url, path: data2.path || res.path || '', hash: data2.hash || res.hash || '', target: sel }
                try { m.report({ type:'snap', check:'snap', ok:true, url: payload.url, path: payload.path, hash: payload.hash, target: sel, agent: true }) } catch {}
                try { network.send(JSON.stringify(payload)) } catch {}
              } catch {
                try { network.send(JSON.stringify({ type:'webscreenshot_result', ok:true, url: res.url, path: res.path||'', hash: res.hash||'', target: sel })) } catch {}
              }
            }
          }).catch(() => {})
        } catch {}
        break
      }
      case 'check': {
        // Agent real check without creating a file: {type:'check', kind:'js'|'mermaid'|'html', code:'...'}
        try {
          import('./check.js').then(async m => {
            const kind = data.kind || data.check || 'js'
            const code = data.code || data.html || ''
            let r
            if (kind === 'js') r = m.checkJS(code)
            else if (kind === 'mermaid') r = await m.checkMermaid(code)
            else if (kind === 'html') r = m.checkHTML(code)
            else r = { ok: false, msg: 'unknown kind' }
            m.report({ type:'check', check:kind, ok:r.ok, msg:r.msg||'', url:location.href })
          }).catch(()=>{})
        } catch {}
        break
      }
      case 'runE2E':
      case 'frontend-automation': {
        // Agent real automation: {type:'frontend-automation', steps:[{action:'fill', target:'#title3', value:'Hi'}, {action:'click', target:'#submit3'}]}
        try {
          const steps = data.steps || data.payload || []
          import('./check.js').then(m => m.runE2E(steps).catch(()=>{})).catch(()=>{})
        } catch {}
        break
      }
      case 'whiteboard_open': {
        // Open whiteboard to a page: {type:'whiteboard_open', page:3}
        try { whiteboard.goToPage(data.page || 1) } catch {}
        break
      }
      case 'whiteboard_next': {
        try { whiteboard.step(1) } catch {}
        break
      }
      case 'whiteboard_prev': {
        try { whiteboard.step(-1) } catch {}
        break
      }
      case 'whiteboard_expand': {
        try {
          const panel = document.getElementById('whiteboard-panel')
          if (panel) {
            panel.classList.remove('wb-closed')
            panel.classList.add('wb-open')
          }
        } catch {}
        break
      }
      case 'whiteboard_close_panel': {
        try {
          const panel = document.getElementById('whiteboard-panel')
          if (panel) {
            panel.classList.remove('wb-open')
            panel.classList.add('wb-closed')
          }
        } catch {}
        break
      }
      case 'whiteboard_check': {
        // Run all checks on current page: mermaid + js + e2e
        try {
          import('./check.js').then(async m => {
            const body = document.getElementById('whiteboard-body')
            if (!body) {
              m.report({type:'check', check:'e2e', ok:false, msg:'whiteboard-body not found'})
              return
            }
            // Initialize mermaid if available
            if (window.mermaid) {
              try { window.mermaid.initialize({startOnLoad: false}) } catch {}
            }
            // Check all mermaid code blocks in the whiteboard
            const mermaidBlocks = body.querySelectorAll('pre code.language-mermaid, pre code[data-language="mermaid"], .mermaid')
            let mermaidIdx = 0
            let mermaidOk = true
            for (const block of mermaidBlocks) {
              const code = block.textContent || block.innerText || ''
              if (code.trim()) {
                const r = await m.checkMermaid(code)
                if (!r.ok) mermaidOk = false
                m.report({type:'check', check:'mermaid', ok:r.ok, msg:r.msg||'', idx:mermaidIdx, url:location.href})
                mermaidIdx++
              }
            }
            // Also check any script tags for JS errors
            const scripts = body.querySelectorAll('script')
            let jsIdx = 0
            let jsOk = true
            for (const script of scripts) {
              const code = script.textContent || ''
              if (code.trim()) {
                const r = m.checkJS(code)
                if (!r.ok) jsOk = false
                m.report({type:'check', check:'js', ok:r.ok, msg:r.msg||'', idx:jsIdx, url:location.href})
                jsIdx++
              }
            }
            m.report({type:'check', check:'e2e', ok: mermaidOk && jsOk, msg:`checked ${mermaidIdx} mermaid, ${jsIdx} js blocks; mermaid_ok=${mermaidOk}, js_ok=${jsOk}`, url:location.href})
          }).catch(()=>{})
        } catch {}
        break
      }
      case 'webscreenshot_result':
      case 'check_result':
        // Server ack, no-op
        break
    }
  } catch (e2) {
    addMessage('assistant', e.data)
  }
}

export function connect() {
  if (network.getState() !== network.State.DISCONNECTED) network.disconnect()
  abortHistoryFetch()

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  // WS path is derived from <base href> so it works both standalone (/ws)
  // and embedded under a tenant prefix (/tenant_.../) via root_dispatch ?ws=1.
  const baseHref = document.querySelector('base')?.getAttribute('href') || '/'
  const wsUrl = baseHref === '/' || baseHref === '' ? '/ws' : baseHref + (baseHref.includes('?') ? '&ws=1' : '?ws=1')
  const url = protocol + '//' + location.host + wsUrl

  network.connect(url, {
    onOpen: () => {
      whiteboard.setSession(authState.sessionId)
      whiteboard.sync()
      const sendResume = (snap) => {
        // Ephemeral replay: if we were mid-stream when the socket dropped,
        // ask the server to replay buffered deltas since our last seq.
        // Runs AFTER history renders, so replayed turns upsert against
        // known turn ids instead of doubling as fresh rows.
        const sid = authState.sessionId || localStorage.getItem('zerowrapper_session') || ''
        // Structured resync: history_snapshot carries the server's buffer
        // max_seq. If our durable cursor is ahead of it (buffer swept/restarted),
        // clamp before resuming so live events are no longer dropped.
        if (snap && typeof snap.max_seq === 'number') reconcileCursor(sid, snap.max_seq)
        const since = getLastSeq(sid)
        if (sid && since > 0) {
          try { network.send(JSON.stringify({ type: 'resume', session_id: sid, since })) } catch {}
        }
        // B: smart detection — history tells us if the session is still
        // `processing` (even though we just reconnected, the turn is still
        // running server-side). If so, keep the stop button, prime the HTTP
        // poll fallback, and arm pending asks from the snapshot so `Done`
        // gating works even before the first replayed `ask_requested`.
        try {
          const status = snap && snap.status
          const running = snap && (snap.running === true || status === 'processing')
          const pend = snap && snap.pending_asks
          if (Array.isArray(pend)) {
            for (const q of pend) if (q && q.id) pendingAskIds.add(String(q.id))
            if (pend.length > 0) {
              // Open drawer from snapshot if not already open (survives refresh)
              import('./ask-drawer.js').then((m) => {
                if (m && m.openWith && pend[0]) {
                  let qs = []
                  try { const raw = pend[0].questions; qs = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []) } catch { qs = [] }
                  // Only open if not already showing this ask
                  try { if (!m.isOpen()) m.openWith({ ask_id: pend[0].id, session_id: pend[0].session_id || sid, questions: qs, kind: pend[0].kind || 'model' }) } catch {}
                }
              }).catch(() => {})
            }
          }
          if (running) { try { streaming.showTyping() } catch {}; startHttpPoll(); if (onStateChange) onStateChange('processing') }
          else { stopHttpPoll() }
        } catch {}
      }
      const resumeWithHistoryStatus = () => sendResume(null)
      try {
        const p = fetchHistory()
        if (p && p.then) p.then((snap) => sendResume(snap), resumeWithHistoryStatus)
        else sendResume(null)
      } catch { sendResume(null) }
    },
    // DISPATCH: without this every pushed frame (thinking/chunk/done,
    // whiteboard_update, agent_status, resumed) is parsed and dropped, so the
    // whiteboard never renders and only the /api/stream poll keeps chat alive.
    onMessage: handleMessage,
    onClose: (e) => {
      // Network blip: local-only. Do NOT cancel the server turn — it
      // keeps buffering via consumeStream so resume can replay it.
      // Only explicit red-button cancel sends {type:cancel}.
      streaming.hideTyping()
      // B: if the snapshot said `processing` but WS died, HTTP poll keeps
      // the tail coming (refresh/network drop while agent busy). Otherwise
      // the turn is idle and we stay quiet.
      try {
        const sid = authState.sessionId || localStorage.getItem('zerowrapper_session') || ''
        // Kick poll optimistically — `startHttpPoll` self-stops if idle
        startHttpPoll()
        // Re-poll pending asks even when WS is down (drawer backup)
        import('./ask-drawer.js').then(m => {}).catch(()=>{})
      } catch {}
      if (onStateChange) onStateChange('disconnect')
    },
  })
}

export function disconnect() {
  network.disconnect()
  streaming.reset()
  toolCalls.clearPending()
  abortHistoryFetch()
}

export function send(text, role, attachments, turn) {
  if (network.getState() !== network.State.CONNECTED) {
    addMessage('error', 'Not connected to backend.')
    return
  }
  const payload = {
    session_id: authState.sessionId || localStorage.getItem('zerowrapper_session') || '',
    content: text,
  }
  if (attachments && attachments.length > 0) payload.attachments = attachments
  if (turn) payload.turn = turn
  network.send(JSON.stringify(payload))
}

export function sendCancel() {
  network.sendCancel(authState.sessionId)
}
