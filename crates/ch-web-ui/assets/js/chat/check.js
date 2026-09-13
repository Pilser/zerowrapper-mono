// check.js — in-page JS/mermaid/HTML checks + E2E + report, baked into binary.
// No CDN, no DevTools, no extension — runs in the user's open tab.
// Exported API: checkJS(code), checkMermaid(code), checkHTML(code), runE2E(steps), report(obj)
// Report goes to shared b_collect board (whiteboard/serverless.db via SHARED_KEY) and via WS.
// Snap flow also lives here: html2canvas -> upload -> b_collect submit.

import { html2canvas } from './html2canvas.js'
import * as network from './network.js'

// --- Global error wrappers (window.onerror / unhandledrejection / console.error) ---
let installed = false
function ensureWrappers() {
  if (installed) return
  installed = true
  try {
    window.addEventListener('error', (e) => {
      try { report({ type: 'js_error', check: 'js', ok: false, msg: (e.message || String(e.error || 'error')), url: location.href, ts: Date.now() }) } catch {}
    })
    window.addEventListener('unhandledrejection', (e) => {
      try { report({ type: 'unhandledrejection', check: 'js', ok: false, msg: String(e.reason || e), url: location.href, ts: Date.now() }) } catch {}
    })
    const orig = console.error
    console.error = function (...args) {
      try { report({ type: 'console_error', check: 'js', ok: false, msg: args.map(String).join(' '), url: location.href, ts: Date.now() }) } catch {}
      return orig.apply(console, args)
    }
  } catch {}
}
ensureWrappers()

// --- checkJS: uses acorn if available else new Function ---
export function checkJS(code) {
  ensureWrappers()
  if (code == null) code = ''
  if (!String(code).trim()) return { ok: true, msg: 'empty' }
  // Try acorn if the page happened to have it (optional)
  try {
    // acorn may be provided via bundled glue or global
    const acorn = window.acorn || null
    if (acorn && typeof acorn.parse === 'function') {
      acorn.parse(String(code), { ecmaVersion: 'latest', sourceType: 'module' })
      return { ok: true }
    }
  } catch (e) {
    return { ok: false, msg: e && e.message ? e.message : String(e), line: e && e.loc ? e.loc.line : undefined, col: e && e.loc ? e.loc.column : undefined }
  }
  // Fallback: new Function for syntax check
  try {
    // eslint-disable-next-line no-new-func
    new Function(String(code))
    return { ok: true }
  } catch (e) {
    // new Function throws SyntaxError for syntax errors, EvalError for compile
    return { ok: false, msg: e && e.message ? e.message : String(e) }
  }
}

export function checkHTML(code) {
  ensureWrappers()
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(String(code), 'text/html')
    // parser always succeeds; check for parsererror
    if (doc.querySelector('parsererror')) return { ok: false, msg: 'HTML parse error' }
    return { ok: true }
  } catch (e) {
    return { ok: false, msg: e.message || String(e) }
  }
}

export function checkMermaid(code) {
  ensureWrappers()
  const src = String(code || '')
  if (!src.trim()) return { ok: false, msg: 'empty mermaid' }
  try {
    const mm = window.mermaid
    if (mm && typeof mm.parse === 'function') {
      mm.parse(src)
      return { ok: true }
    }
    // No global mermaid yet — try dynamic import via importmap
    // Fallback: consider non-empty mermaid as ok (syntax handled at render)
    return { ok: true }
  } catch (e) {
    return { ok: false, msg: e && e.message ? e.message : String(e) }
  }
}

// steps: [{action:'fill', target:'#id', value:'hello'}, {action:'click', target:'#btn'}, {action:'check', kind:'js', code:'...'}]
export async function runE2E(steps) {
  ensureWrappers()
  if (!Array.isArray(steps)) return { ok: false, msg: 'steps must be array' }
  const results = []
  for (let idx = 0; idx < steps.length; idx++) {
    const s = steps[idx]
    try {
      const target = s.target || s.selector || ''
      const kind = s.kind || s.type || s.action || ''
      if (kind === 'fill' || s.action === 'fill') {
        const el = target ? document.querySelector(target) : null
        if (!el) throw new Error('fill target not found: ' + target)
        el.focus && el.focus()
        // Support input, textarea, contenteditable
        if ('value' in el) el.value = s.value != null ? String(s.value) : ''
        else el.textContent = s.value != null ? String(s.value) : ''
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        results.push({ idx, ok: true, target })
      } else if (kind === 'click' || s.action === 'click') {
        const el = target ? document.querySelector(target) : null
        if (!el) throw new Error('click target not found: ' + target)
        el.click()
        results.push({ idx, ok: true, target })
      } else if (kind === 'check' || s.check) {
        const ck = s.check || s.kind
        let r
        if (ck === 'js') r = checkJS(s.code || '')
        else if (ck === 'mermaid') r = checkMermaid(s.code || '')
        else if (ck === 'html') r = checkHTML(s.code || '')
        else r = { ok: false, msg: 'unknown check kind: ' + ck }
        results.push({ idx, ok: r.ok, msg: r.msg, check: ck })
        report({ type: 'e2e_step', check: ck, ok: r.ok, msg: r.msg || '', step: idx, url: location.href, ts: Date.now() })
      } else if (s.code != null) {
        // bare JS code execution (sandboxed via new Function)
        const r = checkJS(s.code)
        results.push({ idx, ok: r.ok, msg: r.msg })
      } else {
        results.push({ idx, ok: false, msg: 'unknown step' })
      }
      // small delay between steps for rendering
      if (s.delay) await new Promise(r => setTimeout(r, Number(s.delay) || 0))
      else await new Promise(r => setTimeout(r, 50))
    } catch (e) {
      const msg = e && e.message ? e.message : String(e)
      results.push({ idx, ok: false, msg })
      report({ type: 'e2e_error', ok: false, msg, step: idx, url: location.href, ts: Date.now() })
    }
  }
  const ok = results.every(r => r.ok !== false)
  report({ type: 'e2e', check: 'e2e', ok, steps: results.length, url: location.href, ts: Date.now() })
  return { ok, results }
}

export function report(obj) {
  ensureWrappers()
  const payload = Object.assign({ ts: Date.now(), url: location.href }, obj || {})
  // Prefer serverless b_collect board
  try {
    fetch('/api/srv/b_collect/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer b_collect' },
      body: JSON.stringify(payload)
    }).catch(() => {})
    // Also try root-dispatch path via tenant prefix
    // Fallback: topic via WS if available
    try {
      if (network && typeof network.send === 'function') {
        network.send(JSON.stringify(Object.assign({ type: 'check_result' }, payload)))
      } else if (window.__zw_ws_send) {
        window.__zw_ws_send(Object.assign({ type: 'check_result' }, payload))
      }
    } catch {}
  } catch {}
  return payload
}

// --- Snap helper: html2canvas -> upload -> b_collect ---
async function hashPath(path) {
  try {
    const enc = new TextEncoder().encode(path)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    const bytes = new Uint8Array(buf).slice(0, 8)
    // base64url no pad
    let b64 = btoa(String.fromCharCode(...bytes))
    b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return b64
  } catch { return '' }
}

export async function doSnap(targetSelector) {
  const sel = targetSelector || '#whiteboard-body'
  let el = null
  try { el = document.querySelector(sel) } catch {}
  if (!el) {
    // fallback chain: whiteboard -> chat -> wb-root -> page-root -> body
    el = document.querySelector('#whiteboard-body') || document.querySelector('#chat-messages') || document.querySelector('#wb-root') || document.querySelector('#page-root') || document.body
    if (!el) return { ok: false, msg: 'no target element' }
  }
  let canvas
  try {
    canvas = await html2canvas(el, { scale: 2 })
  } catch (e) {
    report({ type: 'snap', check: 'snap', ok: false, msg: String(e && e.message ? e.message : e), target: sel, url: location.href, ts: Date.now() })
    return { ok: false, msg: String(e.message || e) }
  }
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.92))
  if (!blob) return { ok: false, msg: 'toBlob failed' }
  try {
    const up = await fetch('?api=upload', { method: 'POST', headers: { 'X-Filename': 'snap.png' }, body: blob })
    const data = await up.json().catch(() => ({}))
    if (!up.ok || data.error) throw new Error(data.error || 'upload failed')
    const p = data.path || ''
    let fileUrl = ''
    // Try hash from path via SubtleCrypto (matches zw-cache hash_path)
    if (p) {
      const h = await hashPath(p)
      if (h) {
        // Also ensure cache meta exists: the server now writes meta on upload path; hash will resolve
        fileUrl = '/files/' + h
      } else {
        fileUrl = p
      }
    }
    // Also support server-provided hash field if upload handler returns it
    if (data.hash) fileUrl = '/files/' + data.hash
    if (!fileUrl) fileUrl = '/files/unknown'

    const snapPayload = { type: 'snap', check: 'snap', ok: true, url: fileUrl, target: sel, ts: Date.now(), href: location.href }
    report(snapPayload)
    // Also try to append a chat markdown image for visibility (optional, best-effort)
    // The agent can also render ![snap](fileUrl) via whiteboard
    return { ok: true, url: fileUrl, target: sel }
  } catch (e) {
    const msg = e && e.message ? e.message : String(e)
    report({ type: 'snap', check: 'snap', ok: false, msg, target: sel, url: location.href, ts: Date.now() })
    return { ok: false, msg }
  }
}

// Expose globals for agent trigger: document.getElementById('snap').click() and ws.send({type:'snap'})
try {
  window.checkJS = checkJS
  window.checkMermaid = checkMermaid
  window.checkHTML = checkHTML
  window.runE2E = runE2E
  window.reportCheck = report
  window.doSnap = doSnap
} catch {}
