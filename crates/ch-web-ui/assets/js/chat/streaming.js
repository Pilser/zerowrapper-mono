import { marked } from 'marked'
import { els } from './dom.js'
import { BOT_AVATAR } from './constants.js'
import { render as renderMarkdown } from './markdown.js'
import { autoScroll } from './scroll.js'
import * as activity from './activity.js'

let el = null
let content = ''
let streamId = 0
let renderPending = false
let onFinalize = null

export function setOnFinalize(cb) { onFinalize = cb }

function getEl() {
  if (!el) {
    const row = document.createElement('div')
    row.className = 'message-row assistant'
    const avatar = document.createElement('div')
    avatar.className = 'msg-avatar'
    avatar.innerHTML = BOT_AVATAR
    row.appendChild(avatar)
    el = document.createElement('div')
    el.className = 'msg-content chat-markdown'
    row.appendChild(el)
    els.messages.appendChild(row)
  }
  return el
}

function scheduleRender(id) {
  if (id !== streamId) return
  if (renderPending) return
  renderPending = true
  requestAnimationFrame(() => {
    renderPending = false
    if (streamId !== id) return
    const target = getEl()
    let html = ''
    if (content) {
      html += marked.parse(content)
    }
    renderMarkdown(target, html)
    autoScroll()
  })
}

export function appendThought(content, container) {
  // Thoughts render in the turn's stacked activity fold (single Thinking row
  // with a live count), regardless of container.
  activity.pushThought(content || '')
}

// Kept for API compatibility; the activity fold manages open state now.
export function closeThought() {}

function finalizeThought() { closeThought() }

export function handleThinking(text, container) {
  if (!container) showTyping()
  appendThought(text, container)
}

export function handleChunk(text) {
  finalizeThought()
  hideTyping()
  content += text
  scheduleRender(streamId)
}

export function finalize() {
  finalizeThought()
  activity.finishTurn()
  if (!el) { if (onFinalize) onFinalize(); return }
  const target = el
  const trimmed = content.trim()
  if (trimmed) {
    target.className = 'msg-content chat-markdown'
    renderMarkdown(target, marked.parse(trimmed))
  }
  el = null
  content = ''
  streamId++
  if (onFinalize) onFinalize()
}

export function flush() {
  // Flush any pending streamed markdown to the DOM without ending the
  // turn's activity fold or toggling the send/cancel button. Used before a
  // tool-call so the text that preceded it becomes a finished bubble but
  // the Thinking/Actions stack stays open for the next actions.
  finalizeThought()
  if (!el) return
  const target = el
  const trimmed = content.trim()
  if (trimmed) {
    target.className = 'msg-content chat-markdown'
    renderMarkdown(target, marked.parse(trimmed))
  }
  el = null
  content = ''
  streamId++
}

export function finalizeIfActive() {
  if (content) flush()
}

export function handleDone(text) {
  finalizeThought()
  hideTyping()
  if (text) content = text
  finalize()
}

export function isActive() {
  return el !== null
}

export function cancel() {
  finalizeThought()
  finalize()
  hideTyping()
}

export function reset() {
  activity.resetTurn()
  if (el) {
    const parent = el.parentElement
    if (parent) parent.remove()
    el = null
  }
  content = ''
  streamId++
}

export function showTyping() {
  if (els.typingEl) {
    els.typingEl.classList.remove('hidden')
    els.typingEl.classList.add('active')
  }
}

export function hideTyping() {
  if (els.typingEl) {
    els.typingEl.classList.add('hidden')
    els.typingEl.classList.remove('active')
  }
}
