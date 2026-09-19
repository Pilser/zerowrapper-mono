// Narrow thinking card: one per thinking burst, slim collapsed bar with
// count badge + word preview, click to expand the full text. Own
// .think-card styles (bright readable text); Motion entrance + shimmer.
import { popIn, shimmer } from '../motion-fx.js'

const CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'

function previewWords(text, n = 56) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= n) return t
  return t.slice(0, n) + '…'
}

// Live burst card. `live:false` skips motion (history rendering).
export function createThinkPile(opts = {}) {
  const live = opts.live !== false
  const card = document.createElement('div')
  card.className = 'think-card running'
  const head = document.createElement('button')
  head.className = 'think-head'
  head.type = 'button'
  head.innerHTML = '<span class="think-icon">💭</span><span class="think-title">Thinking</span><span class="think-count">0</span><span class="think-preview"></span><span class="think-chev">' + CHEV + '</span>'
  const countEl = head.querySelector('.think-count')
  const previewEl = head.querySelector('.think-preview')
  const body = document.createElement('div')
  body.className = 'think-body'
  const pre = document.createElement('pre')
  body.appendChild(pre)
  card.appendChild(head)
  card.appendChild(body)
  head.addEventListener('click', () => {
    card.classList.toggle('open')
  })
  let count = 0
  let full = ''
  let shimmerCtl = null
  const paint = () => {
    if (countEl) countEl.textContent = count
    if (previewEl) previewEl.textContent = full ? previewWords(full) : ''
  }
  paint()
  if (live) {
    try { popIn(card, { index: opts.index || 0 }) } catch {}
    try { shimmerCtl = shimmer(previewEl || card) } catch {}
  }
  return {
    row: card,
    append(text) {
      count += 1
      if (text) {
        full += text
        pre.textContent += text
      }
      paint()
    },
    settle() {
      try {
        if (shimmerCtl && shimmerCtl.stop) shimmerCtl.stop()
        else if (shimmerCtl && shimmerCtl.cancel) shimmerCtl.cancel()
      } catch {}
      shimmerCtl = null
      try {
        const target = previewEl || card
        if (target && target.style) target.style.opacity = ''
      } catch {}
      card.classList.remove('running')
      if (countEl) countEl.textContent = count
    },
  }
}

// Static settled pile for history rendering. Same classes, no motion.
export function renderStaticThink(container, text, count) {
  const pile = createThinkPile({ live: false })
  const t = typeof text === 'string' ? text : ''
  if (t) {
    const pre = pile.row.querySelector('pre')
    if (pre) pre.textContent = t
    const previewEl = pile.row.querySelector('.think-preview')
    const countEl = pile.row.querySelector('.think-count')
    const n = Number.isFinite(count) && count > 0 ? count : 1
    if (countEl) countEl.textContent = n
    if (previewEl) previewEl.textContent = previewWords(t)
  }
  container.appendChild(pile.row)
  return pile.row
}
