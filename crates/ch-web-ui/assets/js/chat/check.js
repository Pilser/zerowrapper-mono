// check.js — in-page JS/mermaid/HTML checks + E2E + report, baked into binary.
// No CDN, no DevTools, no extension — runs in the user's open tab.
// Exported API: checkJS(code), checkMermaid(code), checkHTML(code), runE2E(steps), report(obj)
// Report goes to shared inspect-reports board (whiteboard/serverless.db via SHARED_KEY) and via WS.
// Snap flow also lives here: html2canvas -> upload -> inspect-reports submit.

import { html2canvas } from './html2canvas.js'
import './acorn.js'
import * as network from './network.js'

// --- Global error wrappers (window.onerror / unhandledrejection / console.error + fetch) ---
// Per-file error tracking: captures which script/stack frame caused the error
function extractFileFromError(e) {
  // Try to get filename from error event
  if (e.filename) return e.filename
  // Try stack trace
  const stack = e.error?.stack || e.reason?.stack || ''
  const m = stack.match(/at\s+(?:.*?\s+\()?(https?:\/\/[^\s)]+|\/[^\s)]+)/)
  if (m) return m[1]
  // Try sourceURL
  const src = e.target?.src || e.target?.currentSrc || ''
  if (src) return src
  return ''
}

let installed = false
function ensureWrappers() {
  if (installed) return
  installed = true
  try {
    window.addEventListener('error', (e) => {
      try {
        const file = extractFileFromError(e)
        report({ type: 'js_error', check: 'js', ok: false, msg: (e.message || String(e.error || 'error')), file, lineno: e.lineno, colno: e.colno, url: location.href, ts: Date.now() })
      } catch {}
    })
    window.addEventListener('unhandledrejection', (e) => {
      try {
        const file = extractFileFromError(e)
        report({ type: 'unhandledrejection', check: 'js', ok: false, msg: String(e.reason || e), file, url: location.href, ts: Date.now() })
      } catch {}
    })
    const orig = console.error
    console.error = function (...args) {
      try {
        // Try to extract file from stack trace of first Error arg
        let file = ''
        for (const a of args) {
          if (a instanceof Error && a.stack) {
            const m = a.stack.match(/at\s+(?:.*?\s+\()?(https?:\/\/[^\s)]+|\/[^\s)]+)/)
            if (m) { file = m[1]; break }
          }
        }
        report({ type: 'console_error', check: 'js', ok: false, msg: args.map(String).join(' '), file, url: location.href, ts: Date.now() })
      } catch {}
      return orig.apply(console, args)
    }
    const _fetch = window.fetch
    window.fetch = async (...a) => {
      const url = String(a[0] || '')
      const isInternal = url.includes('inspect-reports') || url.includes('stream_buffer')
      const r = await _fetch(...a)
      if (!r.ok && !isInternal) {
        try { report({ type: 'fetch_error', check: 'e2e', ok: false, msg: `${url} [${r.status} ${r.statusText}]`, url: location.href, ts: Date.now() }) } catch {}
      }
      return r
    }
  } catch {}
}
ensureWrappers()

// --- checkJS: uses acorn if available else new Function ---
export function checkJS(code) {
  ensureWrappers()
  if (code == null) code = ''
  if (!String(code).trim()) return { ok: true, msg: 'empty' }
  // Try acorn if the page happened to have it (optional, baked via oxc_parser.wasm glue)
  try {
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
    return { ok: false, msg: e && e.message ? e.message : String(e) }
  }
}

export function checkHTML(code) {
  ensureWrappers()
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(String(code), 'text/html')
    if (doc.querySelector('parsererror')) return { ok: false, msg: 'HTML parse error' }
    return { ok: true }
  } catch (e) {
    return { ok: false, msg: e.message || String(e) }
  }
}

async function ensureMermaid() {
  // Mermaid is pre-loaded via inline module script in layout.rs
  if (window.mermaid && typeof window.mermaid.parse === 'function') {
    return window.mermaid
  }
  // Fallback: wait for mermaid to load (in case inline script hasn't run yet)
  for (let i = 0; i < 50; i++) {
    if (window.mermaid && typeof window.mermaid.parse === 'function') {
      return window.mermaid
    }
    await new Promise(r => setTimeout(r, 100))
  }
  return null
}

export async function checkMermaid(code) {
  ensureWrappers()
  const src = String(code || '')
  if (!src.trim()) return { ok: false, msg: 'empty mermaid' }
  const mm = await ensureMermaid()
  if (!mm || typeof mm.parse !== 'function') {
    return { ok: false, msg: 'mermaid not loaded' }
  }
  // mermaid.parse returns a Promise in v11 — return it so callers can await
  return mm.parse(src)
    .then(() => ({ ok: true }))
    .catch(e => ({ ok: false, msg: e && e.message ? e.message : String(e) }))
}

// --- Selector resolution: supports CSS, getByText, getByRole, getByLabel, getByPlaceholder, getByTestId ---
function resolveSelector(target) {
  if (!target) return null
  // getByText("Submit") — find element containing exact text
  const textMatch = target.match(/^getByText\(["'](.+?)["']\)$/)
  if (textMatch) {
    const txt = textMatch[1]
    for (const el of document.querySelectorAll('*')) {
      if (el.textContent?.trim() === txt && el.children.length === 0) return el
    }
    // fallback: partial match
    for (const el of document.querySelectorAll('*')) {
      if (el.textContent?.includes(txt) && el.offsetParent !== null) return el
    }
    return null
  }
  // getByRole("button", {name:"Add"}) — find by ARIA role + accessible name
  const roleMatch = target.match(/^getByRole\(["'](\w+)["'](?:,\s*\{name:\s*["'](.+?)["']\})?\)$/)
  if (roleMatch) {
    const [, role, name] = roleMatch
    for (const el of document.querySelectorAll(`[role="${role}"], ${role === 'button' ? 'button' : role === 'textbox' ? 'input,textarea' : role}`)) {
      if (!name || el.textContent?.includes(name) || el.getAttribute('aria-label')?.includes(name)) return el
    }
    return null
  }
  // getByLabel("Email") — find input associated with label
  const labelMatch = target.match(/^getByLabel\(["'](.+?)["']\)$/)
  if (labelMatch) {
    const txt = labelMatch[1]
    for (const label of document.querySelectorAll('label')) {
      if (label.textContent?.includes(txt)) {
        if (label.htmlFor) return document.getElementById(label.htmlFor)
        return label.querySelector('input,textarea,select')
      }
    }
    // fallback: aria-label
    return document.querySelector(`[aria-label="${txt}"]`)
  }
  // getByPlaceholder("Search") — find input with placeholder
  const phMatch = target.match(/^getByPlaceholder\(["'](.+?)["']\)$/)
  if (phMatch) return document.querySelector(`[placeholder="${phMatch[1]}"]`)
  // getByTestId("add-btn") — find data-testid
  const tidMatch = target.match(/^getByTestId\(["'](.+?)["']\)$/)
  if (tidMatch) return document.querySelector(`[data-testid="${tidMatch[1]}"]`)
  // Default: CSS selector
  try { return document.querySelector(target) } catch { return null }
}

// Wait for element to appear (with retry)
async function waitForElement(target, timeoutMs = 3000, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const el = resolveSelector(target)
    if (el) return el
    await new Promise(r => setTimeout(r, intervalMs))
  }
  return null
}

// Check if element is visible
function isVisible(el) {
  if (!el) return false
  if (el.offsetParent === null && el.style.position !== 'fixed') return false
  const s = window.getComputedStyle(el)
  return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0'
}

// steps: [{action:'fill', target:'#id', value:'hello'}, {action:'click', target:'getByText("Submit")'}, ...]
// Supports: CSS selectors, getByText, getByRole, getByLabel, getByPlaceholder, getByTestId
// Options per step: timeout (wait ms), visible (check visibility), delay (post-step ms)
export async function runE2E(steps) {
  ensureWrappers()
  if (!Array.isArray(steps)) return { ok: false, msg: 'steps must be array' }
  const results = []
  for (let idx = 0; idx < steps.length; idx++) {
    const s = steps[idx]
    try {
      const target = s.target || s.selector || ''
      const kind = s.kind || s.type || s.action || ''
      const timeout = Number(s.timeout) || 3000

      if (kind === 'fill' || s.action === 'fill') {
        const el = await waitForElement(target, timeout)
        if (!el) throw new Error('fill target not found: ' + target)
        if (s.visible !== false && !isVisible(el)) throw new Error('fill target not visible: ' + target)
        el.focus && el.focus()
        if ('value' in el) el.value = s.value != null ? String(s.value) : ''
        else el.textContent = s.value != null ? String(s.value) : ''
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        results.push({ idx, ok: true, target })
      } else if (kind === 'click' || s.action === 'click') {
        const el = await waitForElement(target, timeout)
        if (!el) throw new Error('click target not found: ' + target)
        if (s.visible !== false && !isVisible(el)) throw new Error('click target not visible: ' + target)
        el.click()
        results.push({ idx, ok: true, target })
      } else if (kind === 'hover' || s.action === 'hover') {
        const el = await waitForElement(target, timeout)
        if (!el) throw new Error('hover target not found: ' + target)
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
        results.push({ idx, ok: true, target })
      } else if (kind === 'type' || s.action === 'type') {
        const el = await waitForElement(target, timeout)
        if (!el) throw new Error('type target not found: ' + target)
        el.focus && el.focus()
        for (const ch of String(s.value || '')) {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }))
          if ('value' in el) el.value += ch
          el.dispatchEvent(new KeyboardEvent('keypress', { key: ch, bubbles: true }))
          el.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }))
          el.dispatchEvent(new Event('input', { bubbles: true }))
        }
        results.push({ idx, ok: true, target })
      } else if (kind === 'press' || s.action === 'press') {
        const el = await waitForElement(target || ':focus', timeout)
        const key = s.key || s.value || 'Enter'
        if (el) el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
        document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
        results.push({ idx, ok: true, target: target || ':focus' })
      } else if (kind === 'select' || s.action === 'select') {
        const el = await waitForElement(target, timeout)
        if (!el) throw new Error('select target not found: ' + target)
        el.value = s.value || ''
        el.dispatchEvent(new Event('change', { bubbles: true }))
        results.push({ idx, ok: true, target })
      } else if (kind === 'check' || s.check) {
        const ck = s.check || s.kind
        let r
        if (ck === 'js') r = checkJS(s.code || '')
        else if (ck === 'mermaid') r = await checkMermaid(s.code || '')
        else if (ck === 'html') r = checkHTML(s.code || '')
        else r = { ok: false, msg: 'unknown check kind: ' + ck }
        results.push({ idx, ok: r.ok, msg: r.msg, check: ck })
        report({ type: 'e2e_step', check: ck, ok: r.ok, msg: r.msg || '', step: idx, url: location.href, ts: Date.now() })
      } else if (kind === 'assert_text' || s.action === 'assert_text') {
        const el = await waitForElement(target, timeout)
        if (!el) throw new Error('assert_text target not found: ' + target)
        const actual = el.textContent?.trim() || ''
        const expected = s.value || ''
        const ok = s.exact ? actual === expected : actual.includes(expected)
        if (!ok) throw new Error(`assert_text failed: expected "${expected}" in "${actual}"`)
        results.push({ idx, ok: true, target })
      } else if (kind === 'assert_visible' || s.action === 'assert_visible') {
        const el = await waitForElement(target, timeout)
        if (!el) throw new Error('assert_visible target not found: ' + target)
        if (!isVisible(el)) throw new Error('assert_visible failed: element not visible: ' + target)
        results.push({ idx, ok: true, target })
      } else if (kind === 'wait' || s.action === 'wait') {
        await new Promise(r => setTimeout(r, Number(s.value || s.ms || 500)))
        results.push({ idx, ok: true })
      } else if (s.code != null) {
        const r = checkJS(s.code)
        results.push({ idx, ok: r.ok, msg: r.msg })
      } else {
        results.push({ idx, ok: false, msg: 'unknown step: ' + kind })
      }
      if (s.delay) await new Promise(r => setTimeout(r, Number(s.delay) || 0))
      else await new Promise(r => setTimeout(r, 50))
    } catch (e) {
      const msg = e && e.message ? e.message : String(e)
      results.push({ idx, ok: false, msg })
      report({ type: 'e2e_error', ok: false, msg, step: idx, target: s.target, url: location.href, ts: Date.now() })
      // Screenshot on error if snap available
      try {
        const { doSnap } = await import('./check.js').catch(() => ({}))
        if (typeof doSnap === 'function') {
          const snap = await doSnap('#whiteboard-body')
          if (snap && snap.ok) report({ type: 'e2e_error_snap', ok: true, url: snap.url, step: idx, ts: Date.now() })
        }
      } catch {}
    }
  }
  const ok = results.every(r => r.ok !== false)
  report({ type: 'e2e', check: 'e2e', ok, steps: results.length, url: location.href, ts: Date.now() })
  return { ok, results }
}

export function report(obj) {
  ensureWrappers()
  const payload = Object.assign({ ts: Date.now(), url: location.href }, obj || {})
  try {
    fetch('/api/srv/inspect-reports/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer inspect-reports' },
      body: JSON.stringify(payload)
    }).catch(() => {})
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

// --- Snap helper: html2canvas -> upload -> inspect-reports ---
async function hashPath(path) {
  try {
    const enc = new TextEncoder().encode(path)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    const bytes = new Uint8Array(buf).slice(0, 8)
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
    if (p) {
      const h = await hashPath(p)
      if (h) fileUrl = '/files/' + h
      else fileUrl = p
    }
    if (data.hash) fileUrl = '/files/' + data.hash
    if (!fileUrl) fileUrl = '/files/unknown'

    const snapPayload = { type: 'snap', check: 'snap', ok: true, url: fileUrl, path: data.path || '', hash: data.hash || '', target: sel, ts: Date.now(), href: location.href }
    report(snapPayload)
    return { ok: true, url: fileUrl, path: data.path || '', hash: data.hash || '', target: sel, blob }
  } catch (e) {
    const msg = e && e.message ? e.message : String(e)
    report({ type: 'snap', check: 'snap', ok: false, msg, target: sel, url: location.href, ts: Date.now() })
    return { ok: false, msg }
  }
}

// Expose globals for agent trigger
try {
  window.checkJS = checkJS
  window.checkMermaid = checkMermaid
  window.checkHTML = checkHTML
  window.runE2E = runE2E
  window.reportCheck = report
  window.doSnap = doSnap
} catch {}
