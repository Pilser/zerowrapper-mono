// Narrow thinking card: one per thinking burst, slim collapsed bar with
// count badge + word preview, click to expand the full text. Own
// .think-card styles (bright readable text); Motion entrance + shimmer.
import { popIn, shimmer } from '../motion-fx.js'
import * as stylex from '@stylexjs/stylex'
import { p } from './piles.stylex.js'

const cx = (...args) => (stylex.props(...args).className || '')

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
  card.className = cx(p.card, p.cardRunning)
  const head = document.createElement('button')
  head.className = cx(p.head)
  head.type = 'button'
  // Marker classes (think-count/-preview/-chev) stay as JS query hooks;
  // visuals come from the atoms. Same pattern as drawer IDs.
  head.innerHTML = '<span class="think-icon ' + cx(p.icon) + '">💭</span><span class="think-title ' + cx(p.title) + '">Thinking</span><span class="think-count ' + cx(p.count) + '">0</span><span class="think-preview ' + cx(p.preview) + '"></span><span class="think-chev ' + cx(p.chev) + '">' + CHEV + '</span>'
  const countEl = head.querySelector('.think-count')
  const previewEl = head.querySelector('.think-preview')
  const chevEl = head.querySelector('.think-chev')
  const body = document.createElement('div')
  body.className = cx(p.body, p.bodyClosed)
  const pre = document.createElement('pre')
  pre.className = cx(p.thinkPre)
  body.appendChild(pre)
  card.appendChild(head)
  card.appendChild(body)
  // Old CSS showed/hid body + rotated chev via `.open` descendants.
  // StyleX has no descendant selectors: repaint both on toggle. The `open`
  // marker stays for state only.
  const paintOpen = () => {
    const open = card.classList.contains('open')
    body.className = cx(p.body, open ? p.bodyOpen : p.bodyClosed)
    // Preserve the think-chev query hook when repainting.
    if (chevEl) chevEl.className = 'think-chev ' + cx(p.chev, open && p.chevOpen)
  }
  head.addEventListener('click', () => {
    card.classList.toggle('open')
    paintOpen()
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
      // Preserve the `open` marker: auto-dismiss below skips pinned cards.
      const stillOpen = card.classList.contains('open')
      card.classList.remove('running')
      card.className = (stillOpen ? 'open ' : '') + cx(p.card)
      if (countEl) countEl.textContent = count
      if (live) {
        // Auto-dismiss floating burst after a few seconds (history keeps it)
        setTimeout(() => {
          try {
            if (!card.isConnected) return
            if (card.classList.contains('open')) return // keep if user pinned open
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
            card.style.opacity = '0'
            card.style.transform = 'translateY(-8px) scale(0.98)'
            setTimeout(() => { try { card.remove() } catch {} }, 420)
          } catch {}
        }, 4000)
      }
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
