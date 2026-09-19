import { marked } from 'marked'
import { els } from './dom.js'
import { USER_AVATAR, BOT_AVATAR, escapeHtml } from './constants.js'
import { render as renderMarkdown } from './markdown.js'
import { finalize } from './streaming.js'
import { renderStaticTrace } from './activity.js'
import { popIn } from './motion-fx.js'
import { scrollToBottom, autoScroll } from './scroll.js'

export { scrollToBottom }

let abortController = null

function extractMessageText(raw) {
  if (!raw) return ''
  if (raw.startsWith('{')) {
    try {
      const p = JSON.parse(raw)
      if (p.message) return p.message
    } catch (e) {}
  }
  return raw
}

function extractAttachments(raw) {
  if (!raw || !raw.startsWith('{')) return null
  try {
    const p = JSON.parse(raw)
    if (p.attachments && Array.isArray(p.attachments) && p.attachments.length > 0) {
      return p.attachments
    }
  } catch (e) {}
  return null
}

function renderTextWithAttachments(text) {
  const div = document.createElement('div')
  const attachments = extractAttachments(text)
  const msgText = extractMessageText(text)
  if (attachments) {
    const fileList = document.createElement('div')
    fileList.className = 'msg-attachments'
    attachments.forEach((a) => {
      const chip = document.createElement('span')
      chip.className = 'attachment-chip'
      chip.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> ' + escapeHtml(a.filename || a.name || 'file')
      fileList.appendChild(chip)
    })
    div.appendChild(fileList)
  }
  if (msgText) {
    const p = document.createElement('p')
    p.style.margin = attachments ? '6px 0 0' : '0'
    p.textContent = msgText
    div.appendChild(p)
  }
  return div
}

function buildMessageRow(role, text, turn) {
  const row = document.createElement('div')
  row.className = 'message-row ' + role
  row.dataset.role = role
  if (turn) row.dataset.turn = turn

  if (role === 'error') {
    const content = document.createElement('div')
    content.className = 'msg-content'
    content.textContent = text
    row.appendChild(content)
  } else if (role === 'user') {
    const avatar = document.createElement('div')
    avatar.className = 'msg-avatar'
    avatar.innerHTML = USER_AVATAR
    row.appendChild(avatar)
    const content = document.createElement('div')
    content.className = 'msg-content'
    content.appendChild(renderTextWithAttachments(text))
    row.appendChild(content)
  } else {
    const avatar = document.createElement('div')
    avatar.className = 'msg-avatar'
    avatar.innerHTML = BOT_AVATAR
    row.appendChild(avatar)
    const content = document.createElement('div')
    content.className = 'msg-content chat-markdown'
    renderMarkdown(content, marked.parse(text || ''))
    row.appendChild(content)
  }
  return row
}

export function addMessage(role, text, scroll = true) {
  finalize()

  const row = buildMessageRow(role, text)
  els.messages.appendChild(row)
  try { popIn(row) } catch {}
  if (els.hint && els.hint.style.display !== 'none') els.hint.style.display = 'none'
  if (scroll) {
    autoScroll()
  }
}

export function fetchHistory() {
  if (abortController) abortController.abort()
  abortController = new AbortController()

  const sid = localStorage.getItem('zerowrapper_session') || ''
  if (!sid) return

  // Direct API first, root-dispatch fallback for proxied embeds.
  const urls = [
    '/api/history?session_id=' + encodeURIComponent(sid),
    '?api=history&session_id=' + encodeURIComponent(sid),
  ]
  const tryFetch = (i) => {
    if (i >= urls.length) return Promise.resolve(null)
    return fetch(urls[i], { signal: abortController.signal })
      .then(r => (r.ok ? r.json() : tryFetch(i + 1)))
      .catch(() => tryFetch(i + 1))
  };
  return tryFetch(0)
    .then(data => {
      if (!data) return data
      if (data.session_id) {
        localStorage.setItem('zerowrapper_session', data.session_id)
      }
      // B: expose status to caller even when there are no messages, so
      // refresh while `processing` can resume the live tail instead of
      // showing an empty chat. Committed rows still render.
      if (data.messages && data.messages.length > 0) {
        const frag = document.createDocumentFragment()
        data.messages.forEach(msg => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            // Turn-keyed dedup: a row for this turn already on screen (live or
            // an earlier fetch) wins — never render it twice.
            if (msg.turn_id) {
              try {
                if (els.messages.querySelector('[data-turn="' + CSS.escape(msg.turn_id) + '"]')) return
              } catch {}
            }
            const row = buildMessageRow(msg.role, msg.content, msg.turn_id || '')
            if (row) frag.appendChild(row)
          } else if (msg.role === 'trace') {
            // Turn pile (thinking + tool steps), settled and collapsed.
            // Additive branch: user/assistant rendering above untouched.
            // Dedupes on data-trace (never data-turn) so piles and bubbles
            // can never suppress each other.
            const tid = msg.turn_id || ''
            try {
              if (tid && els.messages.querySelector('[data-trace="' + CSS.escape(tid) + '"]')) return
              let trace = null
              try { trace = JSON.parse(msg.content || 'null') } catch {}
              if (!trace) return
              const wrap = renderStaticTrace(frag, trace)
              if (wrap && tid) {
                try { wrap.dataset.trace = tid } catch {}
              }
            } catch {}
          }
        })
        els.messages.appendChild(frag)
        scrollToBottom(false)
      }
      return data
    })
    .catch(() => null)
}

export function abortHistoryFetch() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

// Replace a history-rendered assistant row for a finished turn (replay +
// history convergence): returns true when a row was updated, false when the
// caller should finalize a fresh row instead.
export function upsertAssistantTurn(turnId, content) {
  if (!turnId) return false
  let row = null
  try {
    row = els.messages.querySelector('[data-turn="' + CSS.escape(turnId) + '"][data-role="assistant"]')
  } catch { return false }
  if (!row) return false
  const target = row.querySelector('.msg-content.chat-markdown') || row.querySelector('.msg-content')
  if (!target) return false
  try {
    renderMarkdown(target, marked.parse(content || ''))
  } catch {
    target.textContent = content || ''
  }
  try { autoScroll() } catch {}
  return true
}
