// Corner accent picker: predefined accents switched via data-attr.
// Collapsed by default: shows current color dot; tap to expand full palette.
// Never redefines variables — just selects among preset overrides.
const ACCENTS = [
  { key: 'blue', label: 'Blue', color: '#3b82f6' },
  { key: 'pink', label: 'Pink', color: '#ec4899' },
  { key: 'sun', label: 'Sun', color: '#eab308' },
  { key: 'mint', label: 'Mint', color: '#10b981' },
  { key: 'orange', label: 'Orange', color: '#ff8c00' },
]
const STORE_KEY = 'zerowrapper_accent'

function apply(key) {
  try {
    if (!key || key === 'blue') document.documentElement.removeAttribute('data-accent')
    else document.documentElement.setAttribute('data-accent', key)
  } catch {}
  try {
    document.querySelectorAll('#accent-picker li').forEach((li) => {
      const on = li.getAttribute('data-accent-key') === (key || 'blue')
      if (on) li.classList.add('selected')
      else li.classList.remove('selected')
    })
    // Update toggle dot to current color
    const cur = ACCENTS.find((a) => a.key === (key || 'blue')) || ACCENTS[0]
    const toggle = document.getElementById('accent-picker-toggle')
    if (toggle) toggle.style.background = cur.color
  } catch {}
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
    wrap.className = 'collapsed'
    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.id = 'accent-picker-toggle'
    toggle.setAttribute('aria-label', 'Change accent')
    toggle.title = 'Change accent'
    const list = document.createElement('ul')
    list.className = 'accent-list'
    for (const a of ACCENTS) {
      const li = document.createElement('li')
      li.className = 'ap-' + a.key
      li.setAttribute('data-accent-key', a.key)
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('aria-label', a.label)
      btn.title = a.label
      btn.style.background = a.color
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        try { localStorage.setItem(STORE_KEY, a.key) } catch {}
        const x = e && typeof e.pageX === 'number' ? e.pageX : window.innerWidth / 2
        const y = e && typeof e.pageY === 'number' ? e.pageY : window.innerHeight / 2
        animatePickerChange(a.key, x, y)
        wrap.classList.add('collapsed')
      })
      li.appendChild(btn)
      list.appendChild(li)
    }
    toggle.addEventListener('click', (e) => {
      e.stopPropagation()
      wrap.classList.toggle('collapsed')
    })
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) wrap.classList.add('collapsed')
    })
    wrap.appendChild(toggle)
    wrap.appendChild(list)
    document.body.appendChild(wrap)
    apply(current)
  } catch {}
}
