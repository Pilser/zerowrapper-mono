import * as network from './network.js'
import { els } from './dom.js'
import * as dom from './dom.js'
import * as auth from './auth.js'
import * as connection from './connection.js'
import * as streaming from './streaming.js'
import { addMessage } from './messages.js'
import * as lightbox from './lightbox.js'
import { uploadFile, createAttachmentChip, uploadState } from './file-upload.js'

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

function handleCancel() {
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
    const r = await fetch('/api/agent_sessions')
    if (r.ok) {
      const j = await r.json()
      for (const s of (j.sessions || [])) live[s.id] = s
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
}

function handleSubmit(e) {
  e.preventDefault()
  auth.ensureSession()
  streaming.finalizeIfActive()
  const text = els.input.value.trim()
  const attachments = [...uploadState.pending]
  if (!text && attachments.length === 0) { addMessage('error', 'Cannot send an empty message.'); return }
  if (network.getState() !== network.State.CONNECTED) { addMessage('error', 'Not connected to backend.'); return }
  showStopIcon()
  const combined = text && attachments.length > 0
    ? JSON.stringify({ message: text, attachments: attachments.map(a => ({ filename: a.filename, mime_type: a.mime_type, path: a.path })) })
    : (attachments.length > 0
      ? JSON.stringify({ attachments: attachments.map(a => ({ filename: a.filename, mime_type: a.mime_type, path: a.path })) })
      : text)
  addMessage('user', combined)
  connection.send(text, undefined, attachments.map(a => ({ filename: a.filename, mime_type: a.mime_type, path: a.path })))
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
