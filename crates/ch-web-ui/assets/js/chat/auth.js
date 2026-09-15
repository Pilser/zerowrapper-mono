import { els } from './dom.js'

const STORAGE_SESSION = 'zerowrapper_session'

// Single-user: no login, no roles, no identity. The only state is the
// current chat thread id.
export const state = {
  sessionId: '',
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
  state.sessionId = localStorage.getItem(STORAGE_SESSION) || ''
}

export function loadFromQuery() {
  // ?session_id=sess_xxx resumes a thread. Nothing else is honored.
  const qs = new URLSearchParams(location.search)
  const sid = (qs.get('session_id') || '').trim()
  if (sid) {
    state.sessionId = sid.replace(/[^a-zA-Z0-9_.-]/g, '_')
    saveToStorage()
  }
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
  localStorage.removeItem(STORAGE_SESSION)
}

export function showBadge() {
  // No-op kept for callers: no user identity is displayed anywhere.
  if (els.authSection) els.authSection.classList.add('hidden')
  if (els.userBadge) els.userBadge.classList.add('hidden')
}
