// Corner accent picker: predefined accents. Collapsed by default: shows the
// current color dot; tap to expand. Styling is StyleX (theme-picker.stylex.js).
// The accent EFFECT is applied by setting --color-bg-interactive on <html>
// inline (wins over :root/[data-theme]); no [data-accent] CSS exists anymore.
// Faithful behavior kept: 'blue' is the reset swatch (removes the override so
// the theme default applies), matching the old apply() logic.
import * as stylex from '@stylexjs/stylex'
import { tp, ACCENT_STYLE } from './theme-picker.stylex.js'

const cx = (...args) => (stylex.props(...args).className || '')

const ACCENTS = [
  { key: 'blue', label: 'Blue', color: '#3b82f6' },
  { key: 'pink', label: 'Pink', color: '#ec4899' },
  { key: 'sun', label: 'Sun', color: '#eab308' },
  { key: 'mint', label: 'Mint', color: '#10b981' },
  { key: 'orange', label: 'Orange', color: '#ff8c00' },
]
const STORE_KEY = 'zerowrapper_accent'

let wrapEl = null
let toggleEl = null
let listEl = null
const itemEls = []

function apply(key) {
  const k = key || 'blue'
  const cur = ACCENTS.find((a) => a.key === k) || ACCENTS[0]
  try {
    const root = document.documentElement
    if (!key || key === 'blue') root.style.removeProperty('--color-bg-interactive')
    else root.style.setProperty('--color-bg-interactive', cur.color)
  } catch {}
  itemEls.forEach(({ el, key: ak }) => {
    el.className = cx(tp.item, ACCENT_STYLE[ak], ak === k && tp.itemSelected)
  })
  if (toggleEl) toggleEl.className = cx(tp.toggle, ACCENT_STYLE[cur.key])
}

function setCollapsed(collapsed) {
  if (!wrapEl || !listEl) return
  wrapEl.classList.toggle('collapsed', collapsed)
  listEl.className = cx(tp.list, collapsed && tp.listCollapsed)
}

async function animatePickerChange(key, x, y) {
  const doApply = () => apply(key)
  try {
    const m = await import('./motion.js')
    const av = m.animateView || (m.default && m.default.animateView) || (typeof window !== 'undefined' && window.Motion && window.Motion.animateView)
    if (typeof av === 'function' && typeof document.startViewTransition === 'function') {
      const update = () => doApply()
      const vt = av(update, { duration: 0.4, ease: [0.28, 0.02, 0.1, 0.99] })
      if (vt && typeof vt.new === 'function') {
        await vt.new(
          { clipPath: [`circle(0% at ${x}px ${y}px)`, `circle(150% at ${x}px ${y}px)`] },
          { duration: 0.7, ease: 'easeIn' }
        )
        return
      }
      await vt.finished.catch(() => {})
      return
    }
  } catch {}
  doApply()
  try {
    const chat = document.getElementById('chat-messages')
    if (chat) {
      chat.style.transition = 'transform 0.25s ease'
      chat.style.transform = 'scale(0.99)'
      setTimeout(() => { try { chat.style.transform = '' } catch {} }, 260)
    }
  } catch {}
}

export function init() {
  let current = 'blue'
  try {
    current = localStorage.getItem(STORE_KEY) || 'blue'
  } catch {}
  try {
    if (document.getElementById('accent-picker')) {
      apply(current)
      return
    }
    const wrap = document.createElement('div')
    wrap.id = 'accent-picker'
    wrap.className = cx(tp.wrap)
    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.id = 'accent-picker-toggle'
    toggle.setAttribute('aria-label', 'Change accent')
    toggle.title = 'Change accent'
    const list = document.createElement('ul')
    list.className = cx(tp.list)
    for (const a of ACCENTS) {
      const li = document.createElement('li')
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = cx(tp.item, ACCENT_STYLE[a.key])
      btn.setAttribute('aria-label', a.label)
      btn.title = a.label
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        try { localStorage.setItem(STORE_KEY, a.key) } catch {}
        const x = e && typeof e.pageX === 'number' ? e.pageX : window.innerWidth / 2
        const y = e && typeof e.pageY === 'number' ? e.pageY : window.innerHeight / 2
        animatePickerChange(a.key, x, y)
        setCollapsed(true)
      })
      li.appendChild(btn)
      list.appendChild(li)
      itemEls.push({ el: btn, key: a.key })
    }
    toggle.addEventListener('click', (e) => {
      e.stopPropagation()
      setCollapsed(!wrap.classList.contains('collapsed'))
    })
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) setCollapsed(true)
    })
    wrap.appendChild(toggle)
    wrap.appendChild(list)
    document.body.appendChild(wrap)
    wrapEl = wrap
    toggleEl = toggle
    listEl = list
    setCollapsed(true)
    apply(current)
  } catch {}
}
