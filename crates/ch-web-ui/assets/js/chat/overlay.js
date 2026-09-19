// Live status pill: one fixed floating badge showing what the agent is
// doing right now (thinking pulse, tool spinner, done check), auto-hiding
// when idle. Presentational only — driven from activity.js, never touches
// message DOM, all failures swallowed. Motion animates; plain CSS fallback
// keeps it readable with Motion absent.
import { animate } from './motion.js'

let pill = null
let iconEl = null
let textEl = null
let hideTimer = null

function ensure() {
  if (pill && pill.isConnected) return pill
  pill = document.createElement('div')
  pill.id = 'agent-pill'
  pill.className = 'agent-pill hidden'
  iconEl = document.createElement('span')
  iconEl.className = 'agent-pill-icon'
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
    p.classList.remove('hidden')
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
      try { if (pill) pill.classList.add('hidden') } catch {}
    }, ms)
  } catch {}
}

export function hideNow() {
  try {
    if (hideTimer) { window.clearTimeout(hideTimer); hideTimer = null }
    if (pill) pill.classList.add('hidden')
  } catch {}
}
