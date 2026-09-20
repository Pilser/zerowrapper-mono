// Live status pill: one fixed floating badge showing what the agent is
// doing right now (thinking pulse, tool spinner, done check), auto-hiding
// when idle. Presentational only — driven from activity.js, never touches
// message DOM, all failures swallowed. Motion animates; plain CSS fallback
// keeps it readable with Motion absent.
import { animate } from './motion.js'
import * as stylex from '@stylexjs/stylex'
import { ov } from './overlay.stylex.js'

const cx = (...args) => (stylex.props(...args).className || '')

let pill = null
let iconEl = null
let textEl = null
let hideTimer = null
let feedBox = null
const FEED_MAX = 8

function ensure() {
  if (pill && pill.isConnected) return pill
  pill = document.createElement('div')
  pill.id = 'agent-pill'
  pill.className = cx(ov.pill, ov.pillHidden)
  iconEl = document.createElement('span')
  iconEl.className = cx(ov.icon)
  textEl = document.createElement('span')
  textEl.className = 'agent-pill-text'
  pill.appendChild(iconEl)
  pill.appendChild(textEl)
  document.body.appendChild(pill)
  return pill
}

function show() {
  try {
    const p = ensure()
    p.className = cx(ov.pill)
    if (hideTimer) { window.clearTimeout(hideTimer); hideTimer = null }
  } catch {}
}

function pulse(el) {
  try {
    if (typeof animate === 'function') {
      animate(el, { scale: [1, 1.18, 1] }, { duration: 0.4, ease: 'circOut' })
    }
  } catch {}
}

export function status(icon, text) {
  try {
    ensure()
    if (iconEl) iconEl.textContent = icon || ''
    if (textEl) textEl.textContent = text || ''
    show()
    pulse(pill)
  } catch {}
}

export function hideSoon(ms = 1600) {
  try {
    if (hideTimer) window.clearTimeout(hideTimer)
    hideTimer = window.setTimeout(() => {
      try { if (pill) pill.className = cx(ov.pill, ov.pillHidden) } catch {}
    }, ms)
  } catch {}
}

export function hideNow() {
  try {
    if (hideTimer) { window.clearTimeout(hideTimer); hideTimer = null }
    if (pill) pill.className = cx(ov.pill, ov.pillHidden)
  } catch {}
}

function ensureFeed() {
  if (feedBox && feedBox.isConnected) return feedBox
  feedBox = document.createElement('div')
  feedBox.className = cx(ov.feed, ov.feedHidden)
  document.body.appendChild(feedBox)
  return feedBox
}

// Recent-action feed: latest action on top, auto-dismiss each item after
// a few seconds so it never covers the final response. Slide+fade entrance
// via Motion when available; plain append otherwise.
export function feed(icon, text) {
  try {
    const box = ensureFeed()
    const label = String(text == null ? '' : text).trim()
    if (!label) return
    box.className = cx(ov.feed)
    const item = document.createElement('div')
    item.className = cx(ov.item)
    const ic = document.createElement('span')
    ic.textContent = icon || '•'
    const tx = document.createElement('span')
    tx.textContent = label.length > 42 ? label.slice(0, 42) + '…' : label
    item.appendChild(ic)
    item.appendChild(tx)
    box.prepend(item)
    try {
      if (typeof animate === 'function') {
        animate(item, { opacity: [0, 1], x: [14, 0] }, { duration: 0.3, ease: 'circOut' })
      }
    } catch {}
    // Auto-dismiss this item after 4s (history keeps everything)
    setTimeout(() => {
      try {
        if (!item.isConnected) return
        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
        item.style.opacity = '0'
        item.style.transform = 'translateX(12px)'
        setTimeout(() => { try { item.remove(); if (!box.hasChildNodes()) box.className = cx(ov.feed, ov.feedHidden) } catch {} }, 420)
      } catch {}
    }, 4000)
    while (box.children.length > FEED_MAX) {
      try { box.removeChild(box.lastChild) } catch { break }
    }
    if (hideTimer) window.clearTimeout(hideTimer)
    hideTimer = window.setTimeout(() => {
      try {
        if (pill) pill.className = cx(ov.pill, ov.pillHidden)
        if (feedBox) feedBox.className = cx(ov.feed, ov.feedHidden)
      } catch {}
    }, 9000)
  } catch {}
}
