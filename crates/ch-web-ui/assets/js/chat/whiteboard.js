import * as network from './network.js'
import { renderBoard } from './whiteboard-render.js'

const SWIPE_THRESHOLD = 40

let sessionId = ''
let mode = 'closed'
let panel = null
let body = null
let pins = null
let down = null
let up = null
let dragStartY = null
let dragging = false
let currentState = null
let currentPage = 0
let syncHideTimer = null

function getEl(id) { return document.getElementById(id) }

function getInputTop() {
  const input = activeInput()
  if (!input) return window.innerHeight * 0.6
  return input.getBoundingClientRect().top
}

function applyMode() {
  if (!panel) return
  panel.style.transform = ''
  panel.classList.remove('wb-closed', 'wb-peek', 'wb-full')
  if (mode === 'peek') {
    const offset = -(window.innerHeight - getInputTop())
    panel.style.setProperty('--wb-peek-offset', offset + 'px')
    panel.classList.add('wb-peek')
  } else if (mode === 'full') {
    panel.classList.add('wb-full')
  } else {
    panel.classList.add('wb-closed')
  }
}

function setMode(next) {
  if (next === mode) return
  mode = next
  applyMode()
}

function cycleDown() {
  if (mode === 'closed') setMode('peek')
  else if (mode === 'peek') setMode('full')
}

function cycleUp() {
  if (mode === 'full') setMode('peek')
  else if (mode === 'peek') setMode('closed')
}

function activeInput() {
  const input = getEl('chat-input')
  if (!input) return null
  return input
}

function positionArrows() {
  if (!down || !up) return
  const input = activeInput()
  if (!input) return
  const r = input.getBoundingClientRect()
  const cx = r.left + r.width / 2 + 55
  const top = r.top - 48
  const pos = (btn, x) => {
    btn.style.left = (cx + x) + 'px'
    btn.style.top = top + 'px'
    btn.style.right = 'auto'
    btn.style.bottom = 'auto'
  }
  pos(down, -40)
  pos(up, 6)
}

function wireButton(btn, onTap) {
  if (!btn) return
  btn.addEventListener('click', (e) => {
    if (!dragging) onTap()
  })
  btn.addEventListener('pointerdown', (e) => {
    dragStartY = e.clientY
    dragging = true
    btn.setPointerCapture(e.pointerId)
  })
  btn.addEventListener('pointermove', (e) => {
    if (!dragging || dragStartY === null || !panel) return
    const dy = e.clientY - dragStartY
    if (mode === 'closed') panel.style.transform = `translateY(${Math.min(dy, 120)}px)`
    else if (mode === 'full') panel.style.transform = `translateY(${Math.max(dy, -120)}px)`
  })
  const endDrag = (e) => {
    if (!dragging) return
    const dy = e.clientY - dragStartY
    dragStartY = null
    dragging = false
    if (dy > SWIPE_THRESHOLD) cycleDown()
    else if (dy < -SWIPE_THRESHOLD) cycleUp()
    else applyMode()
  }
  btn.addEventListener('pointerup', endDrag)
  btn.addEventListener('pointercancel', endDrag)
}

export function init() {
  panel = getEl('whiteboard-panel')
  body = getEl('whiteboard-body')
  pins = getEl('whiteboard-pins')
  down = getEl('whiteboard-down')
  up = getEl('whiteboard-up')

  if (!panel) return

  wireButton(down, cycleDown)
  wireButton(up, cycleUp)

  positionArrows()
  window.addEventListener('resize', positionArrows)
  window.addEventListener('scroll', positionArrows, { passive: true })
  document.addEventListener('visibilitychange', () => { if (!document.hidden) positionArrows() })
  new MutationObserver(positionArrows)
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })

  const prev = getEl('wb-prev')
  const next = getEl('wb-next')
  const share = getEl('wb-share')
  const copyLink = getEl('wb-copy-link')
  if (prev) prev.addEventListener('click', () => { currentPage--; renderCurrent() })
  if (next) next.addEventListener('click', () => { currentPage++; renderCurrent() })
  if (share) share.addEventListener('click', () => {
    const p = currentPageData()
    if (!p || !p.public_slug) return
    openPublicUrl(p.public_slug)
  })
  if (copyLink) copyLink.addEventListener('click', () => {
    const p = currentPageData()
    if (!p || !p.public_slug) return
    showLinkPop(p.public_slug)
    copyPublicUrl(p.public_slug)
  })
  document.addEventListener('click', (e) => {
    const pop = getEl('wb-link-pop')
    if (pop && !pop.classList.contains('hidden') && !pop.contains(e.target) &&
        e.target.id !== 'wb-copy-link' && e.target.id !== 'wb-share') {
      pop.classList.add('hidden')
    }
  })

  applyMode()
}

function pageBase() {
  // The chat may be served at `/` or embedded under a prefix such as
  // `/tenant_<id>/` (mirrored in the document <base href>). Build share links
  // against wherever the page was actually loaded.
  const base = document.querySelector('base')?.getAttribute('href') || '/'
  return base.endsWith('/') ? base : base + '/'
}

function publicUrl(slug) {
  const base = pageBase()
  // Canonical pretty link at the root; prefix-relative snapshot (?wb=) when
  // embedded, so the link stays inside the same base path.
  if (base === '/') return location.origin + '/w/' + slug
  return location.origin + base + '?wb=' + encodeURIComponent(slug)
}

function openPublicUrl(slug) {
  window.open(publicUrl(slug), '_blank', 'noopener,noreferrer')
}

function showLinkPop(slug) {
  const pop = getEl('wb-link-pop')
  const input = getEl('wb-link-input')
  const copied = getEl('wb-link-copied')
  if (!pop || !input) return
  input.value = publicUrl(slug)
  input.select()
  if (copied) copied.classList.add('hidden')
  pop.classList.remove('hidden')
}

function copyPublicUrl(slug) {
  const url = publicUrl(slug)
  const done = () => {
    const copied = getEl('wb-link-copied')
    if (!copied) return
    copied.classList.remove('hidden')
    setTimeout(() => copied.classList.add('hidden'), 2000)
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => done())
  } else {
    const input = getEl('wb-link-input')
    if (input) { input.select(); try { document.execCommand('copy') } catch (e) {} }
    done()
  }
}

export function sync() {
  if (!sessionId) return
  const spin = getEl('wb-nav-spinner')
  if (spin) spin.classList.remove('hidden')
  clearTimeout(syncHideTimer)
  syncHideTimer = setTimeout(() => { if (spin) spin.classList.add('hidden') }, 5000)
  // B: tell the backend the real frontend base URL so the agent's
  // `manage_whiteboard set-public` and `inspect` can return tenant-aware
  // links (https://…/tenant_xxx/?wb=slug) instead of local /w/slug or
  // wrong-port guesses. Mirrors the technique `check.js` uses for error reports.
  let baseUrl = ''
  let href = ''
  try { baseUrl = location.origin + pageBase(); href = location.href } catch {}
  network.send(JSON.stringify({ type: 'whiteboard_sync', session_id: sessionId, base_url: baseUrl, href }))
}

export function setSession(sid) {
  if (!sid) return
  if (sid !== sessionId) {
    sessionId = sid
    sync()
  }
}

function renderCurrent() {
  const label = getEl('wb-page-label')
  const share = getEl('wb-share')
  const copyLink = getEl('wb-copy-link')
  const prev = getEl('wb-prev')
  const next = getEl('wb-next')
  if (!currentState || !Array.isArray(currentState.pages) || currentState.pages.length === 0) {
    renderBoard(body, pins, { body_md: '', pins: [] })
    if (label) label.textContent = 'Page 1 of 1'
    if (share) share.classList.add('hidden')
    if (copyLink) copyLink.classList.add('hidden')
    if (prev) prev.disabled = true
    if (next) next.disabled = true
    return
  }
  const pages = currentState.pages
  currentPage = Math.max(0, Math.min(currentPage, pages.length - 1))
  const page = currentPageData()
  renderBoard(body, pins, page)
  if (label) label.textContent = `Page ${currentPage + 1} of ${pages.length}`
  if (prev) prev.disabled = currentPage <= 0
  if (next) next.disabled = currentPage >= pages.length - 1
  const isPub = !!(page && page.public_slug)
  if (share) share.classList.toggle('hidden', !isPub)
  if (copyLink) copyLink.classList.toggle('hidden', !isPub)
  const pop = getEl('wb-link-pop')
  if (pop) pop.classList.add('hidden')
}

function currentPageData() {
  return (currentState && currentState.pages && currentState.pages[currentPage]) || null
}

let lastPageNo = null
let lastBodyHash = ''

export function setBoard(data) {
  const spin = getEl('wb-nav-spinner')
  if (spin) spin.classList.add('hidden')
  clearTimeout(syncHideTimer)
  if (!data) return
  // Fully shared board: never adopt the event's session id (always the
  // shared key now) — the whiteboard module keeps the chat's session.
  if (data.state) {
    const pages = data.state.pages || []
    // B: decouple viewed page from agent's active_page — agent opening a
    // page must not snap the user's view. Preserve current page_no if still
    // present; only on first load or after deletion fall back to active_page.
    const prevNo = currentState && currentState.pages && currentState.pages[currentPage]
      ? currentState.pages[currentPage].page_no
      : null
    let idx = -1
    if (prevNo !== null) idx = pages.findIndex(p => p.page_no === prevNo)
    if (idx < 0) {
      idx = pages.findIndex(p => p.page_no === data.state.active_page)
      if (idx < 0) idx = 0
    }
    currentState = data.state
    currentPage = Math.max(0, Math.min(idx, pages.length - 1))
    // B: skip full re-render when the visible page didn't change — the
    // 500 ms poll was "refresh instead of update" and destroyed in-progress
    // inputs/apps (lost data). Only render when body/pins actually changed.
    const cur = pages[currentPage]
    const curHash = cur ? (cur.body_md + '|' + JSON.stringify(cur.pins || [])) : ''
    const curNo = cur ? cur.page_no : 0
    if (lastPageNo === curNo && lastBodyHash === curHash && pages.length === (window.__wbPrevLen || 0)) {
      // No visible change — just ensure nav labels are current
      const label = getEl('wb-page-label')
      if (label) label.textContent = `Page ${currentPage + 1} of ${pages.length}`
      return
    }
    lastPageNo = curNo
    lastBodyHash = curHash
    window.__wbPrevLen = pages.length
    renderCurrent()
    return
  }
  currentState = null
  renderBoard(body, pins, data)
  const label = getEl('wb-page-label')
  const share = getEl('wb-share')
  const copyLink = getEl('wb-copy-link')
  const pop = getEl('wb-link-pop')
  const prev = getEl('wb-prev')
  const next = getEl('wb-next')
  if (label) label.textContent = 'Page 1 of 1'
  if (share) share.classList.add('hidden')
  if (copyLink) copyLink.classList.add('hidden')
  if (pop) pop.classList.add('hidden')
  if (prev) prev.disabled = true
  if (next) next.disabled = true
}
