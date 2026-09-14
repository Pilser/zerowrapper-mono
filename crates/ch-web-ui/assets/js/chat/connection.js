import * as network from './network.js'
import { els } from './dom.js'
import { state as authState, saveToStorage } from './auth.js'
import { fetchHistory, addMessage, abortHistoryFetch } from './messages.js'
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
function bumpSeqFrom(data) {
  const seq = data && typeof data.seq === 'number' ? data.seq : 0
  const sid = data && data.session_id ? data.session_id : authState.sessionId
  if (seq) setLastSeq(sid, seq)
}

function handleMessage(e) {
  try {
    const data = JSON.parse(e.data)
    if (data && typeof data.seq === 'number') bumpSeqFrom(data)
    switch (data.type) {
      case 'session_created':
        if (data.session_id && data.session_id !== authState.sessionId) {
          authState.sessionId = data.session_id
          saveToStorage()
        }
        whiteboard.setSession(data.session_id)
        break
      case 'whiteboard_update':
        if (data.session_id) whiteboard.setSession(data.session_id)
        whiteboard.setBoard(data)
        break
      case 'resumed':
        // Server ack of replay window; nothing to render
        break
      case 'thinking':
        streaming.handleThinking(data.content)
        break
      case 'chunk':
        streaming.handleChunk(data.content)
        break
      case 'chunk_reset':
        break
      case 'tool_call':
        streaming.flush()
        toolCalls.handleToolCall(data.tool_call_id, data.name, data.args)
        break
      case 'tool_result':
        toolCalls.handleToolResult(data.tool_call_id, data.name, data.output)
        break
      case 'done':
        streaming.handleDone(data.content)
        if (onStateChange) onStateChange('done')
        break
      case 'error':
        streaming.cancel()
        addMessage('error', data.message || data.error || 'Unknown error')
        if (onStateChange) onStateChange('error')
        break
      case 'daemon_status':
        if (els.daemonBanner) {
          if (data.online) els.daemonBanner.classList.add('hidden')
          else els.daemonBanner.classList.remove('hidden')
        }
        break
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
          import('./check.js').then(m => {
            const kind = data.kind || data.check || 'js'
            const code = data.code || data.html || ''
            let r
            if (kind === 'js') r = m.checkJS(code)
            else if (kind === 'mermaid') r = m.checkMermaid(code)
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
        try {
          const targetPage = data.page || 1
          const label = document.getElementById('wb-page-label')
          let currentPage = 1
          if (label) {
            const m = label.textContent?.match(/Page\s+(\d+)/)
            if (m) currentPage = parseInt(m[1], 10) || 1
          }
          const diff = targetPage - currentPage
          const nextBtn = document.getElementById('wb-next')
          const prevBtn = document.getElementById('wb-prev')
          for (let i = 0; i < Math.abs(diff); i++) {
            if (diff > 0 && nextBtn) nextBtn.click()
            else if (diff < 0 && prevBtn) prevBtn.click()
          }
        } catch {}
        break
      }
      case 'whiteboard_next': {
        try {
          const btn = document.getElementById('wb-next')
          if (btn) btn.click()
        } catch {}
        break
      }
      case 'whiteboard_prev': {
        try {
          const btn = document.getElementById('wb-prev')
          if (btn) btn.click()
        } catch {}
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
            // Check all mermaid code blocks in the whiteboard
            const mermaidBlocks = body.querySelectorAll('pre code.language-mermaid, pre code[data-language="mermaid"], .mermaid')
            let mermaidIdx = 0
            for (const block of mermaidBlocks) {
              const code = block.textContent || block.innerText || ''
              if (code.trim()) {
                const r = await m.checkMermaid(code)
                m.report({type:'check', check:'mermaid', ok:r.ok, msg:r.msg||'', idx:mermaidIdx, url:location.href})
                mermaidIdx++
              }
            }
            // Also check any script tags for JS errors
            const scripts = body.querySelectorAll('script')
            let jsIdx = 0
            for (const script of scripts) {
              const code = script.textContent || ''
              if (code.trim()) {
                const r = m.checkJS(code)
                m.report({type:'check', check:'js', ok:r.ok, msg:r.msg||'', idx:jsIdx, url:location.href})
                jsIdx++
              }
            }
            m.report({type:'check', check:'e2e', ok:true, msg:`checked ${mermaidIdx} mermaid, ${jsIdx} js blocks`, url:location.href})
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
  // WS path is derived from the document <base href> so it works both standalone
  // (/ws) and through the daemon's board-scoped AI proxy (/srv/<board>/ai/ws).
  const base = (document.querySelector('base')?.getAttribute('href') || '/').replace(/\/+$/, '')
  const wsPath = base === '' || base === '/' ? '/ws' : base + '/ws'
  const url = protocol + '//' + location.host + wsPath

  network.connect(url, {
    onOpen: () => {
      fetchHistory()
      whiteboard.setSession(authState.sessionId)
      whiteboard.sync()
      // Ephemeral replay: if we were mid-stream when the socket dropped,
      // ask the server to replay buffered deltas since our last seq.
      // This is NOT history — history stays agent DB. Buffer drains 10 min
      // after turn_complete so it never grows.
      const sid = authState.sessionId || localStorage.getItem('zerowrapper_session') || ''
      const since = getLastSeq(sid)
      if (sid && since > 0) {
        try { network.send(JSON.stringify({ type: 'resume', session_id: sid, since })) } catch {}
      }
    },
    onMessage: handleMessage,
    onClose: (e) => {
      // Network blip: local-only. Do NOT cancel the server turn — it
      // keeps buffering via consumeStream so resume can replay it.
      // Only explicit red-button cancel sends {type:cancel}.
      streaming.hideTyping()
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

export function send(text, role, attachments) {
  if (network.getState() !== network.State.CONNECTED) {
    addMessage('error', 'Not connected to backend.')
    return
  }
  const payload = {
    session_id: authState.sessionId || localStorage.getItem('zerowrapper_session') || '',
    user_id: 'single',
    content: text,
  }
  if (attachments && attachments.length > 0) payload.attachments = attachments
  network.send(JSON.stringify(payload))
}

export function sendCancel() {
  network.sendCancel(authState.sessionId)
}
