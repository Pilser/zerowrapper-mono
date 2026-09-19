// Narrow thinking pile: one per thinking burst, slim collapsed bar with
// count + word preview, click to expand the full text. Reuses the settled
// .activity-row.thinking classes so the base stylesheet applies; floating
// lift + shimmer come from .think-pile CSS and motion-fx.
import { popIn, shimmer } from '../motion-fx.js'
const CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'

function previewWords(text, n = 48) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= n) return t
  return t.slice(0, n) + '…'
}

function makeHead() {
  const head = document.createElement('button')
  head.className = 'activity-head'
  head.type = 'button'
  head.innerHTML = '<span class="activity-dot"></span><span class="activity-label"></span><span class="activity-num">0</span><span class="activity-chev">' + CHEV + '</span>'
  return head
}

// Live burst pile: starts collapsed-narrow but `active` (pulsing dot +
// shimmering preview). Returns handles the activity state machine drives.
// `live:false` skips motion (history rendering).
export function createThinkPile(opts = {}) {
  const live = opts.live !== false
  const row = document.createElement('div')
  row.className = 'activity-row thinking active think-pile'
  const head = makeHead()
  const label = head.querySelector('.activity-label')
  const num = head.querySelector('.activity-num')
  const detail = document.createElement('div')
  detail.className = 'activity-detail'
  const pre = document.createElement('pre')
  detail.appendChild(pre)
  row.appendChild(head)
  row.appendChild(detail)
  head.addEventListener('click', () => {
    row.classList.toggle('open')
    if (row.classList.contains('open')) row.dataset.pinned = '1'
    else delete row.dataset.pinned
  })
  let count = 0
  let full = ''
  let shimmerCtl = null
  const paint = () => {
    if (num) num.textContent = count
    if (label) label.textContent = 'Thinking · ' + count + (full ? ' — ' + previewWords(full) : '')
  }
  paint()
  if (live) {
    try { popIn(row) } catch {}
    try { shimmerCtl = shimmer(label) } catch {}
  }
  return {
    row,
    append(text) {
      count += 1
      if (text) {
        full += text
        pre.textContent += text
      }
      paint()
    },
    // Burst over: quiet narrow bar (kept collapsed unless the user pinned).
    settle() {
      try {
        if (shimmerCtl && shimmerCtl.stop) shimmerCtl.stop()
        else if (shimmerCtl && shimmerCtl.cancel) shimmerCtl.cancel()
      } catch {}
      shimmerCtl = null
      try { if (label) label.style.opacity = '' } catch {}
      row.classList.remove('active')
      if (label) label.textContent = 'Thought · ' + count + (full ? ' — ' + previewWords(full) : '')
      if (row.dataset.pinned !== '1') row.classList.remove('open')
    },
  }
}

// Static settled pile for history rendering. Same classes, no motion.
export function renderStaticThink(container, text, count) {
  const pile = createThinkPile({ live: false })
  if (text) {
    const pre = pile.row.querySelector('pre')
    if (pre) pre.textContent = text
  }
  pile.settle()
  // Static piles show the stored count, not a live one.
  try {
    const num = pile.row.querySelector('.activity-num')
    const label = pile.row.querySelector('.activity-label')
    const n = Number.isFinite(count) && count > 0 ? count : (text ? 1 : 0)
    if (num) num.textContent = n
    if (label) label.textContent = 'Thought · ' + n + (text ? ' — ' + previewWords(text) : '')
  } catch {}
  container.appendChild(pile.row)
  return pile.row
}
