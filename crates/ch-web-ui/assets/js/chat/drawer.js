// Side drawer: chats & tools. Slides in from the left, opened by the menu
// icon above the upload button. Replaces the cramped inline session
// dropdown (hidden via CSS) so long session titles can't force horizontal
// scroll on mobile. `#drawer-extras` is reserved for future rows
// (model switch, tools) — see plan after the agent toolset settles.
import { els } from './dom.js'
import * as auth from './auth.js'
import * as connection from './connection.js'
import { fetchHistory } from './messages.js'
import * as stylex from '@stylexjs/stylex'
import { s } from './drawer.stylex.js'

// Merge stylex atoms into one class string. Falsy conditionals pass through.
const cx = (...args) => (stylex.props(...args).className || '')

// Static shell (Rust-rendered, IDs kept as JS hooks) gets its visuals here.
// State markers 'open'/'hidden' are preserved for isOpen() + first paint;
// their visuals come from the StyleX variants, not the old stylesheet.
function paintShell(open) {
  if (els.drawerOverlay) {
    els.drawerOverlay.className =
      (!open ? 'hidden ' : '') + cx(s.overlay, !open && s.overlayHidden)
  }
  if (els.drawer) {
    els.drawer.className =
      (open ? 'open ' : '') + cx(s.panel, open ? s.panelOpen : s.panelClosed)
  }
}

function paintStatic() {
  const byId = (id) => document.getElementById(id)
  const pairs = [
    ['drawer-header', s.header],
    ['drawer-title', s.title],
    ['drawer-close-btn', s.closeBtn],
    ['drawer-actions', s.actions],
    ['drawer-new-btn', s.newBtn],
    ['drawer-sessions-label', s.label],
    ['drawer-list', s.list],
    ['drawer-usage', s.usage],
  ]
  for (const [id, style] of pairs) {
    const el = byId(id)
    if (el) el.className = cx(style)
  }
}

function fmtTokens(n) {
  n = Number(n) || 0
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function fmtCost(c) {
  c = Number(c) || 0
  return '$' + c.toFixed(4)
}

async function loadLive() {
  // Live engine info (model, token totals, cost) keyed by session id.
  for (const url of ['?api=agent_sessions', '/api/agent_sessions']) {
    try {
      const r = await fetch(url)
      if (!r.ok) continue
      const j = await r.json()
      const map = {}
      for (const s of (j.sessions || [])) map[s.id] = s
      return map
    } catch {}
  }
  return {}
}

export function isOpen() {
  return !!(els.drawer && els.drawer.classList.contains('open'))
}

export function setOpen(open) {
  if (!els.drawer || !els.drawerOverlay) return
  if (open) {
    els.drawer.classList.add('open')
    els.drawer.setAttribute('aria-hidden', 'false')
    els.drawerOverlay.classList.remove('hidden')
    renderList()
  } else {
    els.drawer.classList.remove('open')
    els.drawer.setAttribute('aria-hidden', 'true')
    els.drawerOverlay.classList.add('hidden')
  }
  paintShell(open)
}

export function toggle() {
  setOpen(!isOpen())
}

export async function renderList() {
  if (!els.drawerList) return
  const list = await auth.fetchSessions()
  const live = await loadLive()
  els.drawerList.innerHTML = ''
  if (!list || list.length === 0) {
    const d = document.createElement('div')
    d.className = cx(s.empty)
    d.textContent = 'No chats yet — start a new one.'
    els.drawerList.appendChild(d)
  }
  const seen = new Set()
  for (const s of (list || [])) {
    const id = s.id || s.session_id
    if (!id || seen.has(id)) continue
    seen.add(id)
    const title = (s.title && s.title !== id) ? s.title : id
    const lv = live[id]
    const btn = document.createElement('button')
    btn.type = 'button'
    const isActive = id === auth.state.sessionId
    btn.className = cx(s.item, isActive && s.itemActive)
    const t = document.createElement('span')
    t.className = cx(s.itemTitle, isActive && s.itemTitleActive)
    t.textContent = title
    t.title = title + '\n' + id
    btn.appendChild(t)
    const meta = document.createElement('span')
    meta.className = cx(s.itemMeta)
    meta.textContent = lv && lv.model
      ? lv.model + ' · ' + fmtTokens(lv.input_tokens) + ' in / ' + fmtTokens(lv.output_tokens) + ' out · ' + fmtCost(lv.cost)
      : id
    btn.appendChild(meta)
    btn.addEventListener('click', () => switchSession(id))
    els.drawerList.appendChild(btn)
  }
  renderUsage(live)
}

function renderUsage(live) {
  if (!els.drawerUsage) return
  const id = auth.state.sessionId
  const lv = (live || {})[id]
  if (lv && lv.model) {
    els.drawerUsage.textContent =
      lv.model + ' · ' + (lv.messages || 0) + ' msgs · ' +
      fmtTokens(lv.input_tokens) + ' in / ' + fmtTokens(lv.output_tokens) +
      ' out · ' + fmtCost(lv.cost)
  } else {
    els.drawerUsage.textContent = 'Usage appears here once this chat runs.'
  }
}

export async function refreshUsage() {
  if (!isOpen()) return
  renderUsage(await loadLive())
}

async function switchSession(id) {
  if (!id || id === auth.state.sessionId) {
    setOpen(false)
    return
  }
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
  setOpen(false)
  renderList()
}

async function newChat() {
  const res = await auth.createSession('')
  const id = res.session_id || res.id || auth.genSimpleSid()
  auth.state.sessionId = id
  auth.saveToStorage()
  els.messages.innerHTML = ''
  connection.disconnect()
  connection.connect()
  setOpen(false)
  renderList()
}

export function init() {
  if (els.menuBtn) els.menuBtn.addEventListener('click', toggle)
  if (els.drawerOverlay) els.drawerOverlay.addEventListener('click', () => setOpen(false))
  if (els.drawerCloseBtn) els.drawerCloseBtn.addEventListener('click', () => setOpen(false))
  if (els.drawerNewBtn) els.drawerNewBtn.addEventListener('click', newChat)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false)
  })
  // Refresh the usage footer when a turn finalizes.
  try { connection.setOnStateChange(refreshUsage) } catch {}
  paintStatic()
  paintShell(false)
  renderList()
}
