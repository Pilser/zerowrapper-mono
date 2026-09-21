import * as network from './network.js'
import { els } from './dom.js'
import * as dom from './dom.js'
import * as auth from './auth.js'
import * as connection from './connection.js'
import * as streaming from './streaming.js'
import { addMessage } from './messages.js'
import * as lightbox from './lightbox.js'
import { uploadFile, createAttachmentChip, uploadState } from './file-upload.js'
import * as drawer from './drawer.js'
import * as askDrawer from './ask-drawer.js'
import * as themePicker from './theme-picker.js'
import * as bg from './bg.js'

function logPendingResources() {
  const entries = performance.getEntriesByType('resource')
  const pending = entries.filter(e => !e.responseEnd || e.responseEnd <= 0)
  if (pending.length) {
    console.warn('[resources] pending:', pending.map(r => r.name))
  } else {
    console.log('[resources] all', entries.length, 'resources loaded')
  }
  const fonts = document.fonts ? document.fonts.status : 'n/a'
  console.log('[resources] readyState:', document.readyState, 'fonts:', fonts)
}

export function init() {
  dom.init()
  bg.init()
  logPendingResources()
  setTimeout(logPendingResources, 3000)

  if (els.chatRefreshBtn) {
    els.chatRefreshBtn.addEventListener('click', () => location.reload())
  }

  if (!els.form) return

  lightbox.init(els.messages)

  auth.loadFromQuery()
  auth.loadFromStorage()
  auth.ensureSession()

  // Single-user: always logged in. Show badge, connect, load old sessions.
  auth.showBadge()
  connection.connect()
  refreshSessionList()
  drawer.init()
  askDrawer.init()
  themePicker.init()
  // Send→cancel window: after any (re)connect, ask the server whether this
  // session has a turn in flight and show the matching button. Turn end
  // flips back via streaming.onFinalize; cancel is a real runner abort.
  network.on('stateChange', (s) => {
    if (s === network.State.CONNECTED) syncCancelButton()
  })
  syncCancelButton()

  if (els.sessionNewBtn) els.sessionNewBtn.addEventListener('click', handleNewSession)
  if (els.sessionSelect) els.sessionSelect.addEventListener('change', handleSwitchSession)

  if (els.uploadBtn && els.fileInput) {
    els.uploadBtn.addEventListener('click', () => els.fileInput.click())
    els.fileInput.addEventListener('change', async () => {
      const files = Array.from(els.fileInput.files || [])
      for (const file of files) {
        try {
          const info = await uploadFile(file)
          uploadState.pending.push(info)
          els.attachments.appendChild(createAttachmentChip(info))
        } catch (err) {
          addMessage('error', 'Upload failed: ' + err.message)
        }
      }
      els.fileInput.value = ''
    })
  }

  els.form.addEventListener('submit', handleSubmit)
  els.input.addEventListener('input', autoGrow)
  els.cancelBtn.addEventListener('click', handleCancel)
  streaming.setOnFinalize(showSendIcon)
}

function showSendIcon() {
  if (els.sendBtn) { els.sendBtn.classList.remove('hidden'); els.sendBtn.style.display = 'flex' }
  if (els.cancelBtn) { els.cancelBtn.classList.add('hidden'); els.cancelBtn.style.display = 'none' }
}

function showStopIcon() {
  if (els.sendBtn) { els.sendBtn.classList.add('hidden'); els.sendBtn.style.display = 'none' }
  if (els.cancelBtn) { els.cancelBtn.classList.remove('hidden'); els.cancelBtn.style.display = 'flex' }
}

// Turn key of the latest submitted prompt (null when idle/cancelled). Used
// to tag the key superseded on cancel so the aborted turn's late terminal
// event can't clobber the next turn's row.
let currentTurnKey = null

async function syncCancelButton() {
  // Send→cancel window: after any (re)connect, ask the server whether this
  // session has a turn in flight and show the matching button. Turn end
  // flips back via streaming.onFinalize; cancel is a real runner abort.
  try {
    let running = false
    for (const url of ['?api=agent_sessions', '/api/agent_sessions']) {
      try {
        const r = await fetch(url)
        if (!r.ok) continue
        const j = await r.json()
        const hit = (j.sessions || []).find((s) => (s.id || s.session_id) === auth.state.sessionId)
        running = !!(hit && hit.running)
        break
      } catch {}
    }
    if (running) showStopIcon()
    else showSendIcon()
  } catch {}
}

function handleCancel(e) {
  if (e && e.preventDefault) e.preventDefault()
  // Tag our turn key superseded BEFORE the local finalize: the server's
  // terminal close for the aborted turn may arrive after the next prompt is
  // sent, and must not wipe the new turn (see streaming.handleDone gate).
  try { streaming.markTurnSuperseded(currentTurnKey) } catch {}
  currentTurnKey = null
  connection.sendCancel()
  streaming.cancel()
  showSendIcon()
}

async function refreshSessionList() {
  const list = await auth.fetchSessions()
  // Live engine info (model/cost) for sessions with a running engine.
  // Best-effort: the base list works without it.
  let live = {}
  try {
    // The path form only exists on newer servers; the query form is the
    // canonical one — try both so the suffix works either way.
    for (const url of ['?api=agent_sessions', '/api/agent_sessions']) {
      try {
        const r = await fetch(url)
        if (!r.ok) continue
        const j = await r.json()
        for (const s of (j.sessions || [])) live[s.id] = s
        break
      } catch {}
    }
  } catch (e) {}
  if (!els.sessionSelect) return
  els.sessionSelect.innerHTML = ''
  const seen = new Set()
  for (const s of list) {
    const id = s.id || s.session_id
    if (!id || seen.has(id)) continue
    seen.add(id)
    const opt = document.createElement('option')
    opt.value = id
    const lv = live[id]
    const liveSuffix = lv && lv.model
      ? ' · ' + lv.model + (lv.cost ? ' · $' + Number(lv.cost).toFixed(4) : '')
      : ''
    opt.textContent = (s.title && s.title !== id ? s.title + ' · ' : '') + id + liveSuffix
    if (id === auth.state.sessionId) opt.selected = true
    els.sessionSelect.appendChild(opt)
  }
  if (!seen.has(auth.state.sessionId)) {
    const opt = document.createElement('option')
    opt.value = auth.state.sessionId
    opt.textContent = auth.state.sessionId + ' (current)'
    opt.selected = true
    els.sessionSelect.appendChild(opt)
  }
  auth.showBadge()
}

async function handleNewSession() {
  const res = await auth.createSession('')
  const id = res.session_id || res.id || auth.genSimpleSid()
  auth.state.sessionId = id
  auth.saveToStorage()
  els.messages.innerHTML = ''
  connection.disconnect()
  connection.connect()
  refreshSessionList()
  drawer.renderList()
}

async function handleSwitchSession() {
  const id = els.sessionSelect.value
  if (!id || id === auth.state.sessionId) return
  auth.state.sessionId = id
  auth.saveToStorage()
  els.messages.innerHTML = ''
  const { fetchHistory } = await import('./messages.js')
  const whiteboard = await import('./whiteboard.js')
  connection.disconnect()
  connection.connect()
  fetchHistory()
  whiteboard.setSession(id)
  auth.showBadge()
  refreshSessionList()
  drawer.renderList()
}

function handleSubmit(e) {
  e.preventDefault()
  auth.ensureSession()
  streaming.finalizeIfActive()
  const text = els.input.value.trim()
  const attachments = [...uploadState.pending]
  if (!text && attachments.length === 0) { addMessage('error', 'Cannot send an empty message.'); return }
  if (network.getState() !== network.State.CONNECTED) { addMessage('error', 'Not connected to backend.'); return }
  // NOTE: showStopIcon goes AFTER addMessage — addMessage runs
  // streaming.finalize() first (which fires onFinalize → showSendIcon when
  // idle), so showing stop before it flips straight back to Send and the
  // cancel window never visibly opens.
  // Displayed row: plain text + chips (renderTextWithAttachments splits it).
  const wireAttachments = attachments.map(a => ({ filename: a.filename, mime_type: a.mime_type, size: a.size, path: a.path, url: a.url || '' }))
  const combined = text && attachments.length > 0
    ? JSON.stringify({ message: text, attachments: wireAttachments })
    : (attachments.length > 0
      ? JSON.stringify({ attachments: wireAttachments })
      : text)
  // Client turn key: tags the optimistic row so history rows and the
  // final Done upsert against it instead of doubling.
  const turnKey = 't' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36)
  currentTurnKey = turnKey
  streaming.setActiveTurn(turnKey)
  addMessage('user', combined)
  showStopIcon()
  try {
    const lr = els.messages.lastElementChild
    if (lr) { lr.dataset.turn = turnKey; lr.dataset.role = 'user' }
  } catch {}
  connection.send(text, undefined, wireAttachments, turnKey)
  streaming.showTyping()
  els.input.value = ''
  els.input.style.height = 'auto'
  uploadState.pending = []
  if (els.attachments) els.attachments.innerHTML = ''
}

function autoGrow() {
  els.input.style.height = 'auto'
  els.input.style.height = Math.min(els.input.scrollHeight, 300) + 'px'
}
