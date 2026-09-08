import { els } from './dom.js'

const STORAGE_EMAIL = 'zerowrapper_email'
const STORAGE_SESSION = 'zerowrapper_session'
const STORAGE_NAME = 'zerowrapper_name'
const STORAGE_ROLE = 'zerowrapper_role'
const STORAGE_ROLES = 'zerowrapper_roles'

export const state = {
  email: '',
  sessionId: '',
  name: '',
  role: '',
  roles: [],
}

export const agent = (window.ZW_AGENT || '').toString()

export function buildSessionId(email) {
  const sanitized = String(email || '').replace(/[^a-zA-Z0-9_.@-]/g, '_')
  return 'web.' + agent + '.' + sanitized
}

// Single-user simple thread id: sess_xxx (no user/role/channel composite).
export function genSimpleSid() {
  const n = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36)
  return 'sess_' + n.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

export async function fetchSessions() {
  // Try direct API first (standalone), fallback to root dispatch (?api=) for
  // board-proxy embeds where only `/` is reachable.
  for (const url of ['/api/sessions', '?api=sessions']) {
    try {
      const r = await fetch(url)
      if (!r.ok) continue
      const j = await r.json()
      if (j.sessions) return j.sessions
    } catch {}
  }
  return []
}

export async function createSession(title) {
  for (const url of ['/api/sessions', '?api=sessions_create']) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || '' }),
      })
      if (!r.ok) continue
      return await r.json()
    } catch {}
  }
  // Offline fallback: local-only thread (will be persisted on first send).
  const id = genSimpleSid()
  return { session_id: id, title: title || id }
}

export function loadFromStorage() {
  // Single-user: no email login. Session is a simple sess_xxx thread id.
  state.sessionId = localStorage.getItem(STORAGE_SESSION) || ''
  state.email = 'single'
  state.name = 'single user'
  state.role = ''
  state.roles = []
}

export function loadFromQuery() {
  // New: ?session_id=sess_xxx resumes a thread. Legacy ?email= kept for compat.
  const qs = new URLSearchParams(location.search)
  const sid = (qs.get('session_id') || '').trim()
  if (sid) {
    state.sessionId = sid.replace(/[^a-zA-Z0-9_.-]/g, '_')
    state.email = 'single'
    saveToStorage()
    return
  }
  const email = (qs.get('email') || '').trim()
  if (!email) return
  if (localStorage.getItem(STORAGE_SESSION)) return
  state.email = 'single'
  state.sessionId = buildSessionId(email)
  saveToStorage()
}

export function ensureSession() {
  if (!state.sessionId) {
    state.sessionId = genSimpleSid()
    saveToStorage()
  }
  return state.sessionId
}

export function saveToStorage() {
  if (state.sessionId) localStorage.setItem(STORAGE_SESSION, state.sessionId)
}

export function clearFromStorage() {
  localStorage.removeItem(STORAGE_EMAIL)
  localStorage.removeItem(STORAGE_SESSION)
  localStorage.removeItem(STORAGE_NAME)
  localStorage.removeItem(STORAGE_ROLE)
  localStorage.removeItem(STORAGE_ROLES)
}

export function showForm() {
  // No users, no login, no badge — single process. Hide shells if present.
  if (els.authSection) els.authSection.classList.add('hidden')
  if (els.userBadge) els.userBadge.classList.add('hidden')
}

export function showBadge() {
  // No-op kept for callers: no user identity is displayed anywhere.
  if (els.authSection) els.authSection.classList.add('hidden')
  if (els.userBadge) els.userBadge.classList.add('hidden')
}

export function scrollToAuth() {}

export function showAuthError(msg) {
  els.authError.textContent = msg
  els.authError.classList.remove('hidden')
}

export function hideAuthError() {
  els.authError.classList.add('hidden')
}
