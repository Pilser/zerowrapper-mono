// snap.js — floating snap button (small, like whiteboard arrows), baked into binary.
// 34px round, position:fixed, z-index:70, border:1px solid var(--color-border-weak),
// box-shadow:0 2px 10px rgba(0,0,0,.18), whiteboard-arrow style, at bottom:16px; right:16px
// (and bottom:80px when chat input is visible, like whiteboard.js:positionArrows).

import { doSnap } from './check.js'
import * as network from './network.js'

const SNAP_ID = 'snap'

function getEl(id) { return document.getElementById(id) }

function activeInput() {
  const input = getEl('chat-input')
  if (!input) return null
  return input
}

function positionSnap() {
  const btn = getEl(SNAP_ID)
  if (!btn) return
  const input = activeInput()
  // Default like whiteboard.js arrows: if input visible, offset to 80px
  let bottom = '16px'
  if (input) {
    // Check if input is visible (offsetParent or computed)
    const style = window.getComputedStyle(input)
    const visible = input.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden'
    if (visible) bottom = '80px'
  }
  btn.style.bottom = bottom
  btn.style.right = '16px'
  btn.style.left = 'auto'
  btn.style.top = 'auto'
}

function ensureButton() {
  let btn = getEl(SNAP_ID)
  if (btn) return btn
  btn = document.createElement('button')
  btn.id = SNAP_ID
  btn.type = 'button'
  btn.className = 'whiteboard-arrow snap-btn'
  btn.setAttribute('aria-label', 'Snap screenshot')
  btn.title = 'Snap screenshot'
  // Position + look (matches spec and whiteboard-arrow)
  btn.style.position = 'fixed'
  btn.style.zIndex = '70'
  btn.style.width = '34px'
  btn.style.height = '34px'
  btn.style.borderRadius = '50%'
  btn.style.border = '1px solid var(--color-border-weak)'
  btn.style.boxShadow = '0 2px 10px rgba(0,0,0,.18)'
  btn.style.background = 'var(--color-bg)'
  btn.style.color = 'var(--color-text)'
  btn.style.display = 'flex'
  btn.style.alignItems = 'center'
  btn.style.justifyContent = 'center'
  btn.style.cursor = 'pointer'
  btn.style.right = '16px'
  btn.style.bottom = '16px'
  // Simple camera icon (SVG)
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="4"></circle></svg>'
  document.body.appendChild(btn)
  return btn
}

function wireButton(btn) {
  if (!btn || btn.dataset.wired === '1') return
  btn.dataset.wired = '1'
  btn.addEventListener('click', async () => {
    const target = btn.dataset.target || '#whiteboard-body'
    btn.disabled = true
    btn.style.opacity = '0.6'
    try {
      const res = await doSnap(target)
      // Visual feedback
      if (res && res.ok) {
        btn.style.borderColor = 'var(--color-status-success, #2ecc71)'
        setTimeout(() => { btn.style.borderColor = '' }, 900)
      }
    } catch {}
    finally {
      btn.disabled = false
      btn.style.opacity = ''
    }
  })
}

export function initSnap() {
  const btn = ensureButton()
  wireButton(btn)
  positionSnap()
  window.addEventListener('resize', positionSnap)
  window.addEventListener('scroll', positionSnap, { passive: true })
  document.addEventListener('visibilitychange', () => { if (!document.hidden) positionSnap() })
  try {
    new MutationObserver(positionSnap).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] })
  } catch {}
  // Also watch for input visibility changes
  const inp = activeInput()
  if (inp) {
    try { new MutationObserver(positionSnap).observe(inp, { attributes: true, attributeFilter: ['class', 'style'] }) } catch {}
  }

  // Agent trigger helpers:
  //   document.getElementById('snap').dataset.target='#chat-messages'; document.getElementById('snap').click()
  //   window.snap('#wb-root')
  //   ws.send({type:'snap', target:'#whiteboard-body'})  (via patched network.send / global ws)
  try {
    window.snap = (sel) => {
      const b = getEl(SNAP_ID)
      if (b) b.dataset.target = sel || '#whiteboard-body'
      return doSnap(sel)
    }
    window.addEventListener('zw-snap', (e) => {
      const t = e.detail && e.detail.target ? e.detail.target : (e.detail || '#whiteboard-body')
      doSnap(t)
    })
    // Provide global ws for spec compatibility: ws.send({type:'snap', target:'...'})
    // The in-page agent JS may call ws.send directly; we intercept snap types locally.
    if (!window.ws) window.ws = {}
    window.ws.send = function (data) {
      try {
        const obj = typeof data === 'string' ? JSON.parse(data) : data
        if (obj && obj.type === 'snap') {
          const sel = obj.target || obj.selector || '#whiteboard-body'
          const b = getEl(SNAP_ID)
          if (b) b.dataset.target = sel
          doSnap(sel)
          return
        }
      } catch {}
      // Fallback to network.send for other messages (chat etc)
      try { return network.send(typeof data === 'string' ? data : JSON.stringify(data)) } catch {}
    }
    window.__zw_ws_send = window.ws.send
    // Also expose for tests: document.getElementById('snap').click() works via wireButton
  } catch {}
}

export function handleSnapMessage(data) {
  // Called from connection.js when WS receives {type:'snap', target:'...'}
  if (!data || data.type !== 'snap') return false
  const target = data.target || data.selector || '#whiteboard-body'
  const btn = getEl(SNAP_ID)
  if (btn) btn.dataset.target = target
  doSnap(target)
  return true
}
