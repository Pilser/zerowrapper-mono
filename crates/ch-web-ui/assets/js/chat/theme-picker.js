// Corner accent picker: predefined accents switched via data-attr.
// Never redefines variables — just selects among preset overrides.
const ACCENTS = [
  { key: 'blue', label: 'Blue' },
  { key: 'pink', label: 'Pink' },
  { key: 'sun', label: 'Sun' },
  { key: 'mint', label: 'Mint' },
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
  } catch {}
}

async function animatePickerChange(key, x, y) {
  const doApply = () => apply(key)
  // Try Motion's View Transition circular wipe; fallback to instant.
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
      // Fallback if .new not available: just await view transition
      await vt.finished.catch(() => {})
      return
    }
  } catch {}
  // Fallback: small pop on the chat backdrop + instant switch
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
    const ul = document.createElement('ul')
    ul.id = 'accent-picker'
    for (const a of ACCENTS) {
      const li = document.createElement('li')
      li.className = 'ap-' + a.key
      li.setAttribute('data-accent-key', a.key)
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('aria-label', a.label)
      btn.title = a.label
      btn.addEventListener('click', (e) => {
        try { localStorage.setItem(STORE_KEY, a.key) } catch {}
        const x = e && typeof e.pageX === 'number' ? e.pageX : window.innerWidth / 2
        const y = e && typeof e.pageY === 'number' ? e.pageY : window.innerHeight / 2
        animatePickerChange(a.key, x, y)
      })
      li.appendChild(btn)
      ul.appendChild(li)
    }
    document.body.appendChild(ul)
    apply(current)
  } catch {}
}
