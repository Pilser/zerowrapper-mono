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
