// File viewer drawer: shows files pinned via show_file tool.
// - Floating icon anchored just ABOVE the snap button (reads #snap position),
//   z-index 72 > drawer 71 > snap 70, always visible, toggles open/close.
// - Drawer hidden on initial load; only auto-opens when a NEW file is added
//   after load (prevLen>0 && hasNew) — refresh lands in chat.
// - Slim chrome (header 34px, tabs 30px) so content gets max space.
// - Controls (Prev / Next / Download / Remove / Close) in the header.
// - Renderers are vendored dist files: pdfjs-dist + docx-preview via import
//   map, xlsx + pptx-preview via window globals (UMD script tags). No bun
//   install needed at build — same pattern as mermaid/katex.

import * as stylex from '@stylexjs/stylex'
import { fv } from './file-viewer.stylex.js'
import { marked } from 'marked'
import { render as renderMarkdown } from './markdown.js'

let files = [] // [{id, path, url, download_url, name}]
let currentIndex = 0
let loaded = new Set()
let locked = false // when true, ignore incoming updates + pause polling
let lastSig = '' // signature of last applied file list (skip no-op refreshes)
let _pdfjsP = null
let _docxP = null

function filesSig(arr) {
  return (arr || []).map((f) => f.id + ':' + f.path).join('|')
}

const PDF_MAX_PAGES = 40

function fileIcon(path) {
  const ext = (path.split('.').pop() || '').toLowerCase()
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return '🖼️'
  if (['mp4','webm','mov','avi'].includes(ext)) return '🎬'
  if (['mp3','wav','ogg','m4a'].includes(ext)) return '🎵'
  if (ext === 'pdf') return '📄'
  if (['doc','docx'].includes(ext)) return '📝'
  if (['xls','xlsx','csv'].includes(ext)) return '📊'
  if (['ppt','pptx'].includes(ext)) return '📽️'
  if (ext === 'md' || ext === 'markdown') return '📘'
  return '📁'
}

function getSessionId() {
  try {
    return localStorage.getItem('zerowrapper_session') || 'shared'
  } catch {
    return 'shared'
  }
}

function applyStyle(el, ...styles) {
  const p = stylex.props(...styles.filter(Boolean))
  if (p.className) el.className = (el.className ? el.className + ' ' : '') + p.className
  // @ts-ignore
  if (p.style) Object.assign(el.style, p.style)
  return el
}

function el(tag, styles, props) {
  const node = document.createElement(tag)
  if (styles) applyStyle(node, ...styles)
  if (props) Object.assign(node, props)
  return node
}

// --- Renderer loaders (lazy, vendored) -------------------------------------

function getPdfjs() {
  if (!_pdfjsP) {
    _pdfjsP = import('pdfjs-dist')
      .then((m) => {
        const lib = m && m.getDocument ? m : m.default || m
        try {
          if (lib.GlobalWorkerOptions && window.__zwPdfWorker) {
            lib.GlobalWorkerOptions.workerSrc = window.__zwPdfWorker
          }
        } catch {}
        return lib
      })
      .catch((e) => {
        _pdfjsP = null
        throw e
      })
  }
  return _pdfjsP
}

function getDocx() {
  if (!_docxP) {
    _docxP = import('docx-preview').catch((e) => {
      _docxP = null
      throw e
    })
  }
  return _docxP
}

// --- Icon positioning ------------------------------------------------------

let _snapObserver = null

function ensureSnapObserver() {
  if (_snapObserver || !window.MutationObserver) return
  const snap = document.getElementById('snap')
  if (!snap) return
  _snapObserver = new MutationObserver(positionIcon)
  _snapObserver.observe(snap, { attributes: true, attributeFilter: ['style'] })
}

function positionIcon() {
  const icon = document.getElementById('file-viewer-icon')
  if (!icon) return
  ensureSnapObserver()
  const snap = document.getElementById('snap')
  let bottom = 124
  if (snap) {
    const b = parseFloat(snap.style.bottom)
    if (!isNaN(b)) bottom = b + 34 + 10
  }
  icon.style.bottom = bottom + 'px'
  icon.style.right = '16px'
  icon.style.left = 'auto'
  icon.style.top = 'auto'
}

// --- DOM construction ------------------------------------------------------

function ensureElements() {
  let icon = document.getElementById('file-viewer-icon')
  let drawer = document.getElementById('file-viewer-drawer')

  if (!icon) {
    icon = el('button', [fv.icon], { id: 'file-viewer-icon' })
    icon.type = 'button'
    icon.title = 'Files being worked on — click to open'
    icon.innerHTML = '📁 <span class="file-viewer-badge">0</span>'
    icon.addEventListener('click', () => {
      const d = document.getElementById('file-viewer-drawer')
      if (d && !d.classList.contains('hidden')) closeDrawer()
      else openDrawer()
    })
    document.body.appendChild(icon)
  }
  positionIcon()
  icon.classList.remove('hidden')
  icon.style.display = 'flex'
  icon.style.zIndex = '72'

  if (!drawer) {
    drawer = el('div', [fv.drawer], { id: 'file-viewer-drawer' })
    drawer.classList.add('hidden')
    drawer.style.display = 'none'

    const header = el('div', [fv.header])
    header.id = 'file-viewer-header'

    const title = el('span', [fv.title], { textContent: 'Files' })
    title.className += ' file-viewer-title'
    const count = el('span', [fv.count])
    count.className += ' file-viewer-count'

    const controls = el('div', [fv.controls])

    const prev = el('button', [fv.controlBtn], { id: 'file-viewer-prev', textContent: '← Prev' })
    prev.type = 'button'
    const next = el('button', [fv.controlBtn], { id: 'file-viewer-next', textContent: 'Next →' })
    next.type = 'button'
    const download = el('a', [fv.downloadBtn], { id: 'file-viewer-download', textContent: 'Download' })
    download.setAttribute('download', '')
    const refresh = el('button', [fv.controlBtn], { id: 'file-viewer-refresh', textContent: '⟳' })
    refresh.type = 'button'
    refresh.title = 'Reload current file'
    const lock = el('button', [fv.controlBtn], { id: 'file-viewer-lock', textContent: '🔓 Live' })
    lock.type = 'button'
    lock.title = 'Lock the view (pause auto-refresh) so reading is not interrupted'
    const remove = el('button', [fv.removeBtn], { id: 'file-viewer-remove', textContent: 'Remove' })
    remove.type = 'button'
    remove.title = 'Remove current file from viewer'
    const close = el('button', [fv.closeBtn], { id: 'file-viewer-close', textContent: '✕' })
    close.type = 'button'
    close.title = 'Close viewer'

    controls.append(prev, next, refresh, download, lock, remove, close)
    header.append(title, count, controls)

    const tabs = el('div', [fv.tabs])
    tabs.className += ' file-viewer-tabs'
    const content = el('div', [fv.content])
    content.className += ' file-viewer-content'
    const footer = el('div', [fv.footer])

    drawer.append(header, tabs, content, footer)
    document.body.appendChild(drawer)

    // Delegated listener — survives tab re-render.
    drawer.addEventListener('click', (e) => {
      const target = e.target
      if (!target || !target.closest) return
      if (target.closest('#file-viewer-close')) {
        e.preventDefault()
        closeDrawer()
        return
      }
      if (target.closest('#file-viewer-prev')) {
        e.preventDefault()
        navigate(-1)
        return
      }
      if (target.closest('#file-viewer-next')) {
        e.preventDefault()
        navigate(1)
        return
      }
      if (target.closest('#file-viewer-refresh')) {
        e.preventDefault()
        if (files[currentIndex]) loadFile(currentIndex)
        return
      }
      if (target.closest('#file-viewer-lock')) {
        e.preventDefault()
        toggleLock()
        return
      }
      if (target.closest('#file-viewer-remove')) {
        e.preventDefault()
        if (files[currentIndex]) removeFile(files[currentIndex].id)
        return
      }
    })
  }

  return { icon, drawer }
}

function updateIcon() {
  const { icon } = ensureElements()
  positionIcon()
  icon.classList.remove('hidden')
  icon.style.display = 'flex'
  icon.style.zIndex = '72'
  const badge = `<span class="file-viewer-badge">${files.length}</span>`
  const drawer = document.getElementById('file-viewer-drawer')
  const isOpen = drawer && !drawer.classList.contains('hidden')
  icon.innerHTML = (isOpen ? '✕ ' : '📁 ') + badge
  icon.title = files.length
    ? files.length + ' file(s) — click to ' + (isOpen ? 'close' : 'open') + ' viewer'
    : 'No files pinned — agent will show files here'
}

function openDrawer() {
  const { drawer } = ensureElements()
  drawer.classList.remove('hidden')
  drawer.style.display = 'flex'
  updateIcon()
  updateTabs()
  if (files.length > 0) loadFile(currentIndex)
  else {
    const content = drawer.querySelector('.file-viewer-content')
    if (content) content.innerHTML = '<div class="fv-empty">No files pinned</div>'
  }
}

function closeDrawer() {
  const { drawer } = ensureElements()
  drawer.classList.add('hidden')
  drawer.style.display = 'none'
  updateIcon()
}

function navigate(dir) {
  const newIndex = currentIndex + dir
  if (newIndex < 0 || newIndex >= files.length) return
  currentIndex = newIndex
  loadFile(currentIndex)
  updateTabs()
}

function toggleLock() {
  locked = !locked
  updateTabs()
  updateIcon()
}

async function removeFile(id) {
  const sid = getSessionId()
  try {
    await fetch('/api/files/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: id, session_id: sid }),
    })
  } catch {}
  try {
    await fetch(
      `?api=files_close&file_id=${encodeURIComponent(id)}&session_id=${encodeURIComponent(sid)}`,
      { method: 'POST' }
    )
  } catch {}

  files = files.filter((x) => x.id !== id)
  loaded.delete(id)
  lastSig = filesSig(files)
  if (currentIndex >= files.length) currentIndex = Math.max(0, files.length - 1)
  updateIcon()
  updateTabs()
  const drawer = document.getElementById('file-viewer-drawer')
  const content = drawer ? drawer.querySelector('.file-viewer-content') : null
  if (files.length === 0) {
    if (content) content.innerHTML = '<div class="fv-empty">No files pinned</div>'
  } else {
    loadFile(currentIndex)
  }
}

function updateTabs() {
  const drawer = document.getElementById('file-viewer-drawer')
  if (!drawer) return
  const title = drawer.querySelector('.file-viewer-title')
  if (title && files[currentIndex]) {
    const fname = files[currentIndex].path.split('/').pop() || 'File'
    title.textContent = fname
    title.title = files[currentIndex].path
  } else if (title) {
    title.textContent = 'Files'
    title.removeAttribute('title')
  }
  const count = drawer.querySelector('.file-viewer-count')
  if (count) count.textContent = files.length ? `${currentIndex + 1} / ${files.length}` : ''

  const tabs = drawer.querySelector('.file-viewer-tabs')
  if (tabs) {
    tabs.innerHTML = ''
    files.forEach((f, i) => {
      const tab = el('div', [fv.tab, i === currentIndex ? fv.tabActive : null])
      tab.className += ' file-viewer-tab' + (i === currentIndex ? ' active' : '')
      const label = el('button', [fv.tabLabel], {
        textContent: `${i + 1}. ${f.path.split('/').pop()}`,
      })
      label.type = 'button'
      label.title = f.path
      label.addEventListener('click', () => {
        currentIndex = i
        loadFile(currentIndex)
        updateTabs()
      })
      const closeBtn = el('button', [fv.tabClose], { textContent: '×' })
      closeBtn.type = 'button'
      closeBtn.title = 'Remove from viewer'
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        removeFile(f.id)
      })
      tab.append(label, closeBtn)
      tabs.appendChild(tab)
    })
  }

  const prev = drawer.querySelector('#file-viewer-prev')
  const next = drawer.querySelector('#file-viewer-next')
  if (prev) {
    prev.disabled = currentIndex === 0
    prev.style.opacity = currentIndex === 0 ? '0.4' : '1'
    prev.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto'
  }
  if (next) {
    next.disabled = currentIndex >= files.length - 1
    next.style.opacity = currentIndex >= files.length - 1 ? '0.4' : '1'
    next.style.pointerEvents = currentIndex >= files.length - 1 ? 'none' : 'auto'
  }
  const remove = drawer.querySelector('#file-viewer-remove')
  if (remove) remove.style.display = files.length ? '' : 'none'
  const lock = drawer.querySelector('#file-viewer-lock')
  if (lock) {
    lock.textContent = locked ? '🔒 Locked' : '🔓 Live'
    lock.title = locked
      ? 'View locked — auto-refresh paused. Click to resume live updates.'
      : 'Live — click to lock the view and pause auto-refresh.'
    lock.style.borderColor = locked ? 'var(--color-status-running)' : 'var(--color-border-weak)'
    lock.style.color = locked ? 'var(--color-status-running)' : 'var(--color-text)'
  }
  const dl = drawer.querySelector('#file-viewer-download')
  if (dl && files[currentIndex]) {
    dl.href = files[currentIndex].download_url || files[currentIndex].url
    dl.setAttribute('download', files[currentIndex].path.split('/').pop() || 'download')
    dl.style.opacity = '1'
    dl.style.pointerEvents = 'auto'
  } else if (dl) {
    dl.removeAttribute('href')
    dl.style.opacity = '0.5'
    dl.style.pointerEvents = 'none'
  }
}

// --- Rendering -------------------------------------------------------------

function extOf(file) {
  let ext = (file.path.split('.').pop() || '').toLowerCase()
  if (!ext || file.path.indexOf('.') === -1) {
    const mime = (file.mime || '').toLowerCase()
    if (mime.includes('image')) ext = 'png'
    else if (mime.includes('pdf')) ext = 'pdf'
    else if (mime.includes('video')) ext = 'mp4'
    else if (mime.includes('audio')) ext = 'mp3'
  }
  if (ext === 'jpeg') ext = 'jpg'
  return ext
}

async function renderPdf(url, content) {
  const pdfjsLib = await getPdfjs()
  const pdf = await pdfjsLib.getDocument({ url }).promise
  const wrap = el('div', [fv.pdfWrap])
  const total = Math.min(pdf.numPages, PDF_MAX_PAGES)
  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p)
    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = el('canvas', [fv.pdfCanvas])
    canvas.width = viewport.width
    canvas.height = viewport.height
    wrap.appendChild(canvas)
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
  }
  content.innerHTML = ''
  content.appendChild(wrap)
}

async function renderDocx(url, content) {
  const mod = await getDocx()
  const renderAsync = mod.renderAsync || (mod.default && mod.default.renderAsync)
  const buf = await (await fetch(url)).arrayBuffer()
  const wrap = el('div', [fv.docWrap])
  content.innerHTML = ''
  content.appendChild(wrap)
  await renderAsync(buf, wrap, wrap, {
    ignoreWidth: true,
    ignoreHeight: true,
    inWrapper: false,
    breakPages: true,
  })
}

const SHEET_CSS =
  '.fv-sheet table{border-collapse:collapse;width:auto;max-width:100%;font-size:12px;color:#111;background:#fff;}' +
  '.fv-sheet td,.fv-sheet th{border:1px solid #c9ccd1;padding:2px 8px;white-space:nowrap;vertical-align:top;}' +
  '.fv-sheet tr:first-child td{background:#f3f4f6;font-weight:600;}' +
  '.fv-sheet h3{margin:10px 0 4px;font-size:13px;color:#333;font-weight:600;}'

function renderXlsx(buf, content) {
  const XLSX = window.XLSX
  if (!XLSX) throw new Error('xlsx not loaded')
  const wb = XLSX.read(buf, { type: 'array' })
  const wrap = el('div', [fv.sheetWrap])
  wrap.className += ' fv-sheet'
  let html = `<style>${SHEET_CSS}</style>`
  wb.SheetNames.forEach((name) => {
    html += `<h3>${escapeHtml(name)}</h3>`
    html += XLSX.utils.sheet_to_html(wb.Sheets[name], { editable: false })
  })
  wrap.innerHTML = html
  content.innerHTML = ''
  content.appendChild(wrap)
}

async function renderPptx(url, content) {
  const pptxPreview = window.pptxPreview
  if (!pptxPreview || !pptxPreview.init) throw new Error('pptx-preview not loaded')
  const buf = await (await fetch(url)).arrayBuffer()
  const wrap = el('div', [fv.pptxWrap])
  // White backdrop so slides don't render on the dark theme background.
  wrap.style.backgroundColor = '#ffffff'
  content.innerHTML = ''
  content.appendChild(wrap)
  const width = Math.max(320, Math.min(content.clientWidth || 900, 1280))
  const previewer = pptxPreview.init(wrap, {
    width,
    height: Math.round(width * 0.5625),
    mode: 'list',
  })
  await previewer.preview(buf)
}

async function loadFile(index) {
  if (index < 0 || index >= files.length) return
  const file = files[index]
  const drawer = document.getElementById('file-viewer-drawer')
  const content = drawer ? drawer.querySelector('.file-viewer-content') : null
  if (!content) return

  content.innerHTML = `<div class="fv-loading">Loading ${escapeHtml(
    file.path.split('/').pop() || file.path
  )}…</div>`

  const ext = extOf(file)
  const url = file.url

  try {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      const img = el('img', [fv.mediaImage])
      img.src = url
      img.alt = file.path.split('/').pop() || ''
      img.onerror = () => {
        content.innerHTML = `<div class="fv-error">Failed to load image. <a href="${escapeHtml(
          file.download_url || url
        )}" download>Download</a></div>`
      }
      content.innerHTML = ''
      content.appendChild(img)
    } else if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
      const video = el('video', [fv.mediaVideo])
      video.controls = true
      video.src = url
      content.innerHTML = ''
      content.appendChild(video)
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      const audio = el('audio', [fv.mediaAudio])
      audio.controls = true
      audio.src = url
      content.innerHTML = ''
      content.appendChild(audio)
    } else if (ext === 'pdf') {
      await renderPdf(url, content)
    } else if (['doc', 'docx'].includes(ext)) {
      await renderDocx(url, content)
    } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
      const buf = await (await fetch(url)).arrayBuffer()
      renderXlsx(buf, content)
    } else if (['ppt', 'pptx'].includes(ext)) {
      await renderPptx(url, content)
    } else if (ext === 'md' || ext === 'markdown' || file.path.toLowerCase().endsWith('.md')) {
      const text = await (await fetch(url)).text()
      const html = marked.parse(text.slice(0, 200000))
      const wrap = el('div', [fv.mdWrap])
      wrap.className += ' chat-markdown'
      renderMarkdown(wrap, html)
      content.innerHTML = ''
      content.appendChild(wrap)
    } else {
      const text = await (await fetch(url)).text()
      const pre = el('pre', [fv.preWrap], { textContent: text.slice(0, 100000) })
      content.innerHTML = ''
      content.appendChild(pre)
    }
    loaded.add(file.id)
  } catch (e) {
    content.innerHTML = `<div class="fv-error">Failed to render ${escapeHtml(
      ext
    )}: ${escapeHtml(e && e.message ? e.message : String(e))} — <a href="${escapeHtml(
      file.download_url || url
    )}" download>Download</a></div>`
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// --- Public API ------------------------------------------------------------

export function updateFiles(newFiles) {
  // Locked: freeze the view entirely — ignore incoming updates so reading is
  // never interrupted (scroll/zoom stays put).
  if (locked) return

  const incoming = newFiles || []
  const sig = filesSig(incoming)
  // No-op refresh: same files as last time → don't reload/re-render content.
  // This is what stopped the 3s poll from yanking pdf/md/mermaid back to top.
  if (sig === lastSig) {
    updateIcon()
    return
  }
  lastSig = sig

  const prevLen = files.length
  const prevIds = new Set(files.map((f) => f.id))
  files = [...incoming]
  if (currentIndex >= files.length) currentIndex = 0

  const hasNew = files.some((f) => !prevIds.has(f.id))
  const isNewFileAdded = hasNew && prevLen > 0

  if (isNewFileAdded) {
    currentIndex = 0
    const drawer = document.getElementById('file-viewer-drawer')
    const isDrawerOpen = drawer && !drawer.classList.contains('hidden')
    if (!isDrawerOpen) openDrawer()
    else {
      updateTabs()
      loadFile(currentIndex)
    }
  } else if (hasNew) {
    currentIndex = 0
  }

  const ids = new Set(files.map((f) => f.id))
  for (const id of [...loaded]) if (!ids.has(id)) loaded.delete(id)

  updateIcon()
  const drawer = document.getElementById('file-viewer-drawer')
  if (drawer && !drawer.classList.contains('hidden')) {
    updateTabs()
    if (files.length > 0) loadFile(currentIndex)
    else {
      const content = drawer.querySelector('.file-viewer-content')
      if (content) content.innerHTML = '<div class="fv-empty">No files pinned</div>'
    }
  } else if (files.length > 0) {
    updateTabs()
  }
}

export function init() {
  const { drawer } = ensureElements()
  if (drawer) {
    drawer.classList.add('hidden')
    drawer.style.display = 'none'
  }
  positionIcon()
  updateIcon()

  // Keep the icon glued just above the snap button as it moves (chat input
  // show/hide) and on resize. #snap may not exist yet (snap.js inits after
  // us), so retry briefly and rely on the poll as a final fallback.
  window.addEventListener('resize', positionIcon)
  let tries = 0
  const snapTick = setInterval(() => {
    positionIcon()
    if (_snapObserver || ++tries > 20) clearInterval(snapTick)
  }, 250)

  // Poll for open files (fallback if a WS update was missed).
  setInterval(async () => {
    if (locked) return
    try {
      const sid = getSessionId()
      if (!sid) return
      const r = await fetch(`/api/files/open?session_id=${encodeURIComponent(sid)}`)
      if (!r.ok) return
      const j = await r.json()
      if (j.files) updateFiles(j.files)
    } catch {}
  }, 3000)
}
