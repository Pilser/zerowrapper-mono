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
      btn.addEventListener('click', () => {
        try { localStorage.setItem(STORE_KEY, a.key) } catch {}
        apply(a.key)
      })
      li.appendChild(btn)
      ul.appendChild(li)
    }
    document.body.appendChild(ul)
    apply(current)
  } catch {}
}
