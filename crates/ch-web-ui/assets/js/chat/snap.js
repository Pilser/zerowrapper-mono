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
  let bottom = '16px'
  if (input) {
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
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="4"></circle></svg>'
  document.body.appendChild(btn)
  return btn
}

function wireButton(btn) {
  if (!btn || btn.dataset.wired === '1') return
  btn.dataset.wired = '1'
  btn.addEventListener('click', async (e) => {
    const target = btn.dataset.target || '#whiteboard-body'
    const isHuman = e.isTrusted === true
    btn.disabled = true
    btn.style.opacity = '0.6'
    try {
      const res = await doSnap(target)
      if (res && res.ok) {
        btn.style.borderColor = 'var(--color-status-success, #2ecc71)'
        setTimeout(() => { btn.style.borderColor = '' }, 900)
        if (isHuman) {
          // Human: preview goes to #attachments / file-input area like file picker so user clicks Send
          try {
            const attachments = document.getElementById('attachments')
            const fileInput = document.getElementById('file-input')
            // Import file-upload helpers lazily
            const mod = await import('./file-upload.js').catch(() => null)
            const els = await import('./dom.js').catch(() => null)
            const info = {
              filename: 'snap.png',
              path: res.path || '',
              hash: res.hash || '',
              url: res.url,
              size: res.blob ? res.blob.size : 0,
              mime_type: 'image/png'
            }
            if (mod && mod.uploadState) {
              mod.uploadState.pending.push({ filename: info.filename, path: info.path, hash: info.hash, url: info.url, size: info.size, mime_type: info.mime_type })
            }
            if (attachments && mod && mod.createAttachmentChip) {
              try {
                const chip = mod.createAttachmentChip({ filename: info.filename, size: info.size, path: info.path })
                attachments.appendChild(chip)
              } catch {}
            } else if (attachments) {
              // Fallback chip
              const chip = document.createElement('div')
              chip.className = 'attachment-chip'
              chip.textContent = `snap.png ${res.url}`
              attachments.appendChild(chip)
            }
          } catch {}
        } else {
          // Agent (isTrusted false): also POST to temp folder endpoint so agent can read file
          try {
            if (res.blob) {
              const r2 = await fetch('/api/inspect/snap', {
                method: 'POST',
                headers: { 'X-Filename': 'snap.png', 'X-Target': target },
                body: res.blob
              })
              const data2 = await r2.json().catch(() => ({}))
              const tempPath = data2.path || res.path || ''
              const url = data2.url || res.url
              const hash = data2.hash || res.hash || ''
              // Send WS response so agent gets {ok, url, path, target}
              const payload = { type: 'webscreenshot_result', ok: true, url, path: tempPath, hash, target }
              try { network.send(JSON.stringify(payload)) } catch {}
              try { if (window.__zw_ws_send) window.__zw_ws_send(payload) } catch {}
              // Also ensure report has path
              const { report } = await import('./check.js')
              report({ type: 'snap', check: 'snap', ok: true, url, path: tempPath, hash, target, agent: true })
            } else {
              const payload = { type: 'webscreenshot_result', ok: true, url: res.url, path: res.path || '', hash: res.hash || '', target }
              try { network.send(JSON.stringify(payload)) } catch {}
            }
          } catch {}
        }
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
  const inp = activeInput()
  if (inp) {
    try { new MutationObserver(positionSnap).observe(inp, { attributes: true, attributeFilter: ['class', 'style'] }) } catch {}
  }

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
    if (!window.ws) window.ws = {}
    window.ws.send = function (data) {
      try {
        const obj = typeof data === 'string' ? JSON.parse(data) : data
        if (obj && (obj.type === 'snap' || obj.type === 'webscreenshot')) {
          const sel = obj.target || obj.selector || '#whiteboard-body'
          const b = getEl(SNAP_ID)
          if (b) b.dataset.target = sel
          // Trigger synthetic click with isTrusted false via dispatch? Direct doSnap with agent path
          // We'll simulate agent branch: call doSnap then POST to temp
          import('./check.js').then(async m => {
            const res = await m.doSnap(sel)
            if (res && res.ok && res.blob) {
              try {
                const r2 = await fetch('/api/inspect/snap', { method: 'POST', headers: { 'X-Filename': 'snap.png', 'X-Target': sel }, body: res.blob })
                const data2 = await r2.json().catch(() => ({}))
                const payload = { type: 'webscreenshot_result', ok: true, url: data2.url || res.url, path: data2.path || res.path, hash: data2.hash || res.hash, target: sel }
                try { network.send(JSON.stringify(payload)) } catch {}
              } catch {
                try { network.send(JSON.stringify({ type: 'webscreenshot_result', ok: true, url: res.url, path: res.path || '', target: sel })) } catch {}
              }
            }
          }).catch(()=>{})
          return
        }
        if (obj && (obj.type === 'check' || obj.type === 'frontend-automation' || obj.type === 'runE2E')) {
          // forward to connection handler (also handled there)
        }
      } catch {}
      try { return network.send(typeof data === 'string' ? data : JSON.stringify(data)) } catch {}
    }
    window.__zw_ws_send = window.ws.send
  } catch {}
}

export function handleSnapMessage(data) {
  if (!data || (data.type !== 'snap' && data.type !== 'webscreenshot')) return false
  const target = data.target || data.selector || '#whiteboard-body'
  const btn = getEl(SNAP_ID)
  if (btn) btn.dataset.target = target
  // Trigger agent snap path (isTrusted false)
  import('./check.js').then(async m => {
    const res = await m.doSnap(target)
    if (res && res.ok && res.blob) {
      try {
        const r2 = await fetch('/api/inspect/snap', { method: 'POST', headers: { 'X-Filename': 'snap.png', 'X-Target': target }, body: res.blob })
        const data2 = await r2.json().catch(() => ({}))
        const payload = { type: 'webscreenshot_result', ok: true, url: data2.url || res.url, path: data2.path || res.path, hash: data2.hash || res.hash, target }
        try { network.send(JSON.stringify(payload)) } catch {}
      } catch {
        try { network.send(JSON.stringify({ type: 'webscreenshot_result', ok: true, url: res.url, path: res.path || '', target })) } catch {}
      }
    }
  }).catch(()=>{})
  return true
}
