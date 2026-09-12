import { els } from './dom.js'

const NEAR_BOTTOM_MARGIN = 140

// #chat-messages is the scroll container (it flex-fills the page and scrolls
// internally while the input bar stays pinned below it).
function container() {
  return els.messages || document.getElementById('chat-messages')
}

export function isNearBottom(margin = NEAR_BOTTOM_MARGIN) {
  const c = container()
  if (!c) return true
  return c.scrollHeight - c.scrollTop - c.clientHeight <= margin
}

export function scrollToBottom(smooth = true) {
  const c = container()
  if (!c || !c.lastElementChild) return
  if (typeof c.scrollTo === 'function') {
    c.scrollTo({ top: c.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  } else {
    c.scrollTop = c.scrollHeight
  }
}

// Stick to the bottom only when the user is already reading the bottom.
// Live updates must never yank the view away while scrolled up in history.
export function autoScroll(smooth = true) {
  if (isNearBottom()) scrollToBottom(smooth)
}
