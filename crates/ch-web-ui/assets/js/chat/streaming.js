import { marked } from 'marked'
import { els } from './dom.js'
import { BOT_AVATAR } from './constants.js'
import { render as renderMarkdown } from './markdown.js'
import { autoScroll } from './scroll.js'
import { popIn, rippleLoop } from './motion-fx.js'
import * as activity from './activity.js'
import { rowClass, avatarClass, contentClass } from './messages.stylex.js'
import * as stylex from '@stylexjs/stylex'
import { a } from './activity.stylex.js'

const cx = (...args) => (stylex.props(...args).className || '')

let el = null
let content = ''
let streamId = 0
let renderPending = false
let onFinalize = null

export function setOnFinalize(cb) { onFinalize = cb }

function getEl() {
  if (!el) {
    const row = document.createElement('div')
    row.className = rowClass('assistant')
    const avatar = document.createElement('div')
    avatar.className = avatarClass('assistant')
    avatar.innerHTML = BOT_AVATAR
    row.appendChild(avatar)
    el = document.createElement('div')
    el.className = contentClass('assistant', true)
    row.appendChild(el)
    els.messages.appendChild(row)
    try { popIn(row) } catch {}
  }
  return el
}

function scheduleRender(id) {
  if (id !== streamId) return
  if (renderPending) return
  renderPending = true
  const doRender = () => {
    renderPending = false
    if (streamId !== id) return
    const target = getEl()
    let html = ''
    if (content) {
      html += marked.parse(content)
    }
    renderMarkdown(target, html)
    autoScroll()
  }
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(doRender)
    // Headless/throttled tabs may never fire rAF — fallback to timeout
    setTimeout(() => {
      if (renderPending && streamId === id) doRender()
    }, 50)
  } else {
    setTimeout(doRender, 0)
  }
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
  content += text
  scheduleRender(streamId)
  // Ripple stays visible while streaming, re-anchored below new content.
  try { tickRipple() } catch {}
}

export function finalize() {
  finalizeThought()
  activity.finishTurn()
  if (!el) { if (onFinalize) onFinalize(); return }
  const target = el
  const trimmed = content.trim()
  if (trimmed) {
    target.className = contentClass('assistant', true)
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
    target.className = contentClass('assistant', true)
    renderMarkdown(target, marked.parse(trimmed))
  }
  el = null
  content = ''
  streamId++
}

export function finalizeIfActive() {
  if (content) flush()
}

export function handleDone(text, turnId) {
  finalizeThought()
  hideTyping()
  if (text) content = text
  if (turnId && el && el.parentElement) {
    try {
      el.parentElement.dataset.turn = turnId
      el.parentElement.dataset.role = 'assistant'
    } catch {}
  }
  finalize()
}

// Drop the in-flight partial row without finalizing (used when a Done
// upserts into an already-rendered history row instead).
export function dropPartial() {
  if (el) {
    const parent = el.parentElement
    if (parent) parent.remove()
    el = null
  }
  content = ''
  streamId++
  if (onFinalize) onFinalize()
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

let rippleNode = null
let stopRippleLoop = null

function ensureRipple() {
  if (rippleNode && rippleNode.isConnected) return rippleNode
  try { if (stopRippleLoop) stopRippleLoop() } catch {}
  stopRippleLoop = null
  rippleNode = document.createElement('div')
  rippleNode.className = cx(a.streamRipple)
  const container = document.createElement('div')
  // Keep the `ripple-container` / `ripple` markers: motion-fx's
  // querySelectorAll('.ripple') needs them.
  container.className = 'ripple-container ' + cx(a.rippleContainer)
  for (let i = 0; i < 3; i++) {
    const rp = document.createElement('div')
    rp.className = 'ripple ' + cx(a.ripple)
    container.appendChild(rp)
  }
  const text = document.createElement('span')
  text.className = cx(a.rippleText)
  text.textContent = 'Agent working…'
  rippleNode.appendChild(container)
  rippleNode.appendChild(text)
  return rippleNode
}

// Live position marker: sits BELOW the newest streaming content (tool piles
// + response bubble) and follows down as the turn grows. Replaces the old
// fixed typing indicator. Also drives the dotted-bg tint so the same
// trigger animates both ripple and background.
export function showTyping() {
  try {
    const node = ensureRipple()
    if (els.messages) {
      els.messages.appendChild(node)
      els.messages.classList.add('streaming')
    }
    if (!stopRippleLoop) {
      try { stopRippleLoop = rippleLoop(node.querySelector('.ripple-container')) } catch {}
    }
  } catch {}
}

// Re-anchor the ripple below the latest content (call after every chunk,
// thinking burst, or tool event so it visibly follows the stream down).
export function tickRipple() {
  try {
    if (rippleNode && rippleNode.isConnected && els.messages) {
      els.messages.appendChild(rippleNode)
    }
  } catch {}
}

export function hideTyping() {
  try {
    if (stopRippleLoop) stopRippleLoop()
  } catch {}
  stopRippleLoop = null
  try {
    if (rippleNode && rippleNode.parentElement) rippleNode.parentElement.removeChild(rippleNode)
  } catch {}
  rippleNode = null
  try {
    if (els.messages) els.messages.classList.remove('streaming')
  } catch {}
}
