// File viewer drawer: shows files pinned via show_file tool.
// - Floating icon always visible (bottom-left, above drawer), z-index 72 > drawer 71
// - Drawer hidden on initial load; only opens on new file (prevLen>0 && hasNew) or user click
// - Controls (Prev/Next/Download) moved to header next to tabs, tabs slim 32px, content max space
// - loadFile always renders (no early-return on loaded), handles all ext + mime
// - Close button uses delegation so listener survives tabs re-render

import * as stylex from '@stylexjs/stylex'
import { fv } from './file-viewer.stylex.js'

let files = [] // [{id, path, url, download_url, mime}]
let currentIndex = 0
let loaded = new Set() // ids that have been rendered at least once (for caching but not early-return)

function fileIcon(path) {
  const ext = (path.split('.').pop() || '').toLowerCase()
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return '🖼️'
  if (['mp4','webm','mov','avi'].includes(ext)) return '🎬'
  if (['mp3','wav','ogg','m4a'].includes(ext)) return '🎵'
  if (ext === 'pdf') return '📄'
  if (['doc','docx'].includes(ext)) return '📝'
  if (['xls','xlsx','csv'].includes(ext)) return '📊'
  if (['ppt','pptx'].includes(ext)) return '📽️'
  return '📁'
}

function ensureElements() {
  let icon = document.getElementById('file-viewer-icon')
  let drawer = document.getElementById('file-viewer-drawer')
  if (!icon) {
    icon = document.createElement('button')
    icon.id = 'file-viewer-icon'
    const iconProps = stylex.props(fv.icon)
    icon.className = iconProps.className || ''
    // @ts-ignore
    if (iconProps.style) Object.assign(icon.style, iconProps.style)
    icon.innerHTML = '📁 <span class="file-viewer-badge">0</span>'
    icon.title = 'Files being worked on — click to open'
    // Always visible, bottom-left, z above drawer (72 > 71), not behind snap at right 16px
    icon.style.bottom = '20px'
    icon.style.right = 'auto'
    icon.style.left = '20px'
    icon.style.top = 'auto'
    icon.style.zIndex = '72'
    icon.addEventListener('click', () => {
      const d = document.getElementById('file-viewer-drawer')
      if (d && !d.classList.contains('hidden')) closeDrawer()
      else openDrawer()
    })
    document.body.appendChild(icon)
  } else {
    // Ensure always visible and correct z-index even if stylex had 70
    icon.style.bottom = '20px'
    icon.style.left = '20px'
    icon.style.right = 'auto'
    icon.style.top = 'auto'
    icon.style.zIndex = '72'
    icon.classList.remove('hidden')
  }
  if (!drawer) {
    drawer = document.createElement('div')
    drawer.id = 'file-viewer-drawer'
    const drawerProps = stylex.props(fv.drawer)
    drawer.className = (drawerProps.className || '') + ' hidden'
    // @ts-ignore
    if (drawerProps.style) Object.assign(drawer.style, drawerProps.style)
    const headerProps = stylex.props(fv.header)
    const titleProps = stylex.props(fv.title)
    const countProps = stylex.props(fv.count)
    const tabsProps = stylex.props(fv.tabs)
    const contentProps = stylex.props(fv.content)
    const footerProps = stylex.props(fv.footer)
    const controlsProps = stylex.props(fv.controls)
    const closeProps = stylex.props(fv.closeBtn)
    // Header contains title + count + controls (Prev/Next/Download/Close) at top; tabs slim row below; content flex; footer hidden
    drawer.innerHTML = `
      <div class="${headerProps.className || 'file-viewer-header'}" style="${headerProps.style ? Object.entries(headerProps.style).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';') : ''}">
        <span class="${titleProps.className || 'file-viewer-title'}" style="${titleProps.style ? Object.entries(titleProps.style).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';') : ''}">Files</span>
        <span class="${countProps.className || 'file-viewer-count'}" style="${countProps.style ? Object.entries(countProps.style).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';') : ''}"></span>
        <div class="${controlsProps.className || 'file-viewer-controls'}" style="${controlsProps.style ? Object.entries(controlsProps.style).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';') : ''}">
          <button id="file-viewer-prev">← Prev</button>
          <button id="file-viewer-next">Next →</button>
          <a id="file-viewer-download" class="file-viewer-download" download style="padding:4px 10px; border-radius:8px; background:var(--color-bg-interactive); color:white; text-decoration:none; font-size:12px; line-height:16px;">Download</a>
          <button id="file-viewer-close" class="${closeProps.className || 'file-viewer-close'}" style="${closeProps.style ? Object.entries(closeProps.style).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';') : 'background:none; border:none; cursor:pointer; font-size:18px; padding:4px 8px;'}">✕</button>
        </div>
      </div>
      <div class="${tabsProps.className || 'file-viewer-tabs'}" style="${tabsProps.style ? Object.entries(tabsProps.style).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';') : ''}"></div>
      <div class="${contentProps.className || 'file-viewer-content'}" style="${contentProps.style ? Object.entries(contentProps.style).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';') : ''}"></div>
      <div class="${footerProps.className || 'file-viewer-footer'}" style="${footerProps.style ? Object.entries(footerProps.style).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';') : ''} display:none;"></div>
    `
    document.body.appendChild(drawer)
    // Delegated listener for close/prev/next/download so innerHTML replacement never loses it
    drawer.addEventListener('click', (e) => {
      const target = e.target
      if (!target || !target.closest) return
      if (target.closest('#file-viewer-close')) {
        e.preventDefault()
        e.stopPropagation()
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
    })
  } else {
    // Ensure hidden on initial load if not explicitly opened — caller decides
    // Do not auto-remove hidden here; updateFiles/openDrawer control it
  }
  return { icon, drawer }
}

function updateIcon() {
  const { icon } = ensureElements()
  // Always visible, like whiteboard arrows — shows count
  icon.classList.remove('hidden')
  icon.style.display = 'flex'
  icon.style.bottom = '20px'
  icon.style.left = '20px'
  icon.style.right = 'auto'
  icon.style.zIndex = '72'
  icon.style.opacity = '1'
  const badge = icon.querySelector('.file-viewer-badge')
  if (badge) badge.textContent = String(files.length)
  if (files.length > 0) {
    icon.title = files.length + ' file(s) — click to open viewer'
  } else {
    icon.title = 'No files pinned — agent will show files here'
  }
  const drawer = document.getElementById('file-viewer-drawer')
  const isOpen = drawer && !drawer.classList.contains('hidden')
  if (isOpen) {
    // Keep X visible above drawer (z 72 > 71)
    icon.innerHTML = '✕ <span class="file-viewer-badge">' + files.length + '</span>'
    icon.style.zIndex = '72'
  } else {
    icon.innerHTML = '📁 <span class="file-viewer-badge">' + files.length + '</span>'
    icon.style.zIndex = '72'
  }
}

function openDrawer() {
  const { drawer } = ensureElements()
  drawer.classList.remove('hidden')
  updateIcon()
  if (files.length > 0) {
    updateTabs()
    loadFile(currentIndex)
  }
}

function closeDrawer() {
  const { drawer } = ensureElements()
  drawer.classList.add('hidden')
  updateIcon()
}

function navigate(dir) {
  const newIndex = currentIndex + dir
  if (newIndex < 0 || newIndex >= files.length) return
  currentIndex = newIndex
  loadFile(currentIndex)
  updateTabs()
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
  if (count) count.textContent = files.length ? `${currentIndex+1} / ${files.length}` : ''
  const tabs = drawer.querySelector('.file-viewer-tabs')
  if (tabs) {
    tabs.innerHTML = ''
    files.forEach((f, i) => {
      const tab = document.createElement('div')
      tab.className = 'file-viewer-tab' + (i === currentIndex ? ' active' : '')
      tab.style.cssText = 'display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:8px; border:1px solid var(--color-border-weak); background:' + (i === currentIndex ? 'var(--color-bg-interactive); color:white; border-color:var(--color-bg-interactive)' : 'var(--color-bg); color:var(--color-text)') + '; cursor:pointer; font-size:12px; white-space:nowrap; flex-shrink:0;'
      const label = document.createElement('button')
      label.className = 'file-viewer-tab-label'
      label.style.cssText = 'background:none; border:none; color:inherit; cursor:pointer; font:inherit; padding:0;'
      label.textContent = `${i+1}. ${f.path.split('/').pop()}`
      label.title = f.path
      label.addEventListener('click', () => {
        currentIndex = i
        loadFile(currentIndex)
        updateTabs()
      })
      const closeBtn = document.createElement('button')
      closeBtn.className = 'file-viewer-tab-close'
      closeBtn.style.cssText = 'background:none; border:none; cursor:pointer; font-size:14px; padding:0 2px; color:inherit; opacity:0.7;'
      closeBtn.textContent = '×'
      closeBtn.title = 'Remove from viewer'
      closeBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        try {
          const sid = localStorage.getItem('zerowrapper_session') || 'shared'
          await fetch(`/api/files/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_id: f.id, session_id: sid })
          })
          await fetch(`?api=files_close&file_id=${encodeURIComponent(f.id)}&session_id=${encodeURIComponent(sid)}`, { method: 'POST' }).catch(()=>{})
        } catch {}
        files = files.filter(x => x.id !== f.id)
        loaded.delete(f.id)
        if (currentIndex >= files.length) currentIndex = Math.max(0, files.length - 1)
        updateIcon()
        updateTabs()
        if (files.length === 0) {
          const content = document.querySelector('.file-viewer-content')
          if (content) content.innerHTML = '<div class="file-viewer-empty">No files pinned</div>'
        } else {
          loadFile(currentIndex)
        }
      })
      tab.appendChild(label)
      tab.appendChild(closeBtn)
      tabs.appendChild(tab)
    })
  }
  const prev = drawer.querySelector('#file-viewer-prev')
  const next = drawer.querySelector('#file-viewer-next')
  if (prev) prev.disabled = currentIndex === 0
  if (next) next.disabled = currentIndex === files.length - 1
  const dl = drawer.querySelector('#file-viewer-download')
  if (dl && files[currentIndex]) {
    dl.href = files[currentIndex].download_url || files[currentIndex].url
    dl.download = files[currentIndex].path.split('/').pop() || 'download'
    dl.style.opacity = '1'
    dl.style.pointerEvents = 'auto'
  } else if (dl) {
    dl.removeAttribute('href')
    dl.style.opacity = '0.5'
    dl.style.pointerEvents = 'none'
  }
}

async function loadFile(index) {
  if (index < 0 || index >= files.length) return
  const file = files[index]
  const drawer = document.getElementById('file-viewer-drawer')
  const content = drawer ? drawer.querySelector('.file-viewer-content') : null
  if (!content) return

  // Always render — do not early-return on loaded.has(id), just show loading then render
  content.innerHTML = '<div class="file-viewer-loading">Loading ' + escapeHtml(file.path.split('/').pop() || file.path) + '…</div>'

  // Robust ext detection: use path ext, fallback to mime
  let ext = (file.path.split('.').pop() || '').toLowerCase()
  if (!ext || file.path.indexOf('.') === -1) {
    const mime = (file.mime || '').toLowerCase()
    if (mime.includes('image')) ext = 'png'
    else if (mime.includes('pdf')) ext = 'pdf'
    else if (mime.includes('video')) ext = 'mp4'
    else if (mime.includes('audio')) ext = 'mp3'
  }
  // Normalize aliases
  if (ext === 'jpeg') ext = 'jpg'
  const url = file.url

  try {
    if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) {
      content.innerHTML = `<img src="${url}" class="fv-media-image" style="max-width:100%; max-height:70vh; width:auto; height:auto; object-fit:contain; display:block; margin:0 auto; border-radius:8px;" onerror="this.outerHTML='<div>Failed to load image <a href=&quot;${file.download_url || url}&quot; download>Download</a></div>'" />`
    } else if (['mp4','webm','mov','avi'].includes(ext)) {
      content.innerHTML = `<video controls src="${url}" style="max-width:100%; width:100%; height:auto; max-height:70vh; object-fit:contain; display:block; border-radius:8px; background:#000;"></video>`
    } else if (['mp3','wav','ogg','m4a'].includes(ext)) {
      content.innerHTML = `<audio controls src="${url}" style="width:100%; max-width:600px; display:block; margin:20px auto;"></audio>`
    } else if (ext === 'pdf') {
      if (window.pdfjsLib) {
        content.innerHTML = '<canvas id="pdf-canvas" style="max-width:100%; height:auto; display:block; margin:0 auto; border-radius:8px; box-shadow:0 2px 12px rgba(0,0,0,0.1);"></canvas>'
        const pdf = await window.pdfjsLib.getDocument(url).promise
        const page = await pdf.getPage(1)
        const isMobile = window.innerWidth < 600
        const scale = isMobile ? 1.0 : 1.5
        const viewport = page.getViewport({ scale })
        const canvas = content.querySelector('#pdf-canvas')
        if (canvas) {
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = '100%'
          canvas.style.maxWidth = viewport.width + 'px'
          canvas.style.height = 'auto'
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        }
      } else {
        content.innerHTML = `<iframe src="${url}" style="width:100%; height:70vh; border:none; border-radius:8px; display:block;" loading="lazy"></iframe>`
      }
    } else if (['doc','docx'].includes(ext)) {
      if (window.docxPreview) {
        const res = await fetch(url)
        const buf = await res.arrayBuffer()
        content.innerHTML = '<div id="docx-container" style="width:100%; max-height:80vh; overflow:auto;"></div>'
        await window.docxPreview.renderAsync(buf, content.querySelector('#docx-container'))
      } else {
        content.innerHTML = `<div>Doc preview not available. <a href="${file.download_url || url}" download>Download</a></div>`
      }
    } else if (['xls','xlsx','csv'].includes(ext)) {
      if (window.XLSX) {
        const res = await fetch(url)
        const buf = await res.arrayBuffer()
        const wb = window.XLSX.read(buf, { type: 'array' })
        let html = ''
        wb.SheetNames.forEach(name => {
          const ws = wb.Sheets[name]
          html += `<h3>${escapeHtml(name)}</h3>` + window.XLSX.utils.sheet_to_html(ws)
        })
        content.innerHTML = `<div style="overflow:auto; max-height:80vh; width:100%;">${html}</div>`
      } else {
        content.innerHTML = `<div>Spreadsheet preview not available. <a href="${file.download_url || url}" download>Download</a></div>`
      }
    } else if (['ppt','pptx'].includes(ext)) {
      content.innerHTML = `<div>PPT preview — <a href="${file.download_url || url}" download>Download</a></div>`
    } else if (ext === 'md' || file.path.toLowerCase().endsWith('.md') || (file.mime && file.mime.includes('markdown'))) {
      const res = await fetch(url)
      const text = await res.text()
      try {
        const { marked } = await import('marked')
        const { render } = await import('./markdown.js')
        const html = marked.parse(text.slice(0, 100000))
        const div = document.createElement('div')
        div.className = 'chat-markdown'
        div.style.maxHeight = '75vh'
        div.style.overflow = 'auto'
        div.style.padding = '12px'
        div.style.width = '100%'
        div.style.boxSizing = 'border-box'
        render(div, html)
        content.innerHTML = ''
        content.appendChild(div)
      } catch {
        content.innerHTML = `<pre style="white-space:pre-wrap; word-break:break-word; max-height:80vh; overflow:auto; background:var(--color-bg-weak); padding:12px; border-radius:8px; width:100%; box-sizing:border-box;">${escapeHtml(text.slice(0, 50000))}</pre>`
      }
    } else {
      // Plain text / other
      const res = await fetch(url)
      const text = await res.text()
      content.innerHTML = `<pre style="white-space:pre-wrap; word-break:break-word; max-height:80vh; overflow:auto; background:var(--color-bg-weak); padding:12px; border-radius:8px; width:100%; box-sizing:border-box;">${escapeHtml(text.slice(0, 50000))}</pre>`
    }
    loaded.add(file.id)
  } catch (e) {
    content.innerHTML = `<div>Failed to load: ${escapeHtml(e.message || String(e))} <a href="${file.download_url || url}" download>Download</a></div>`
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export function updateFiles(newFiles) {
  const prevLen = files.length
  const prevIds = new Set(files.map(f => f.id))
  files = [...(newFiles || [])]
  if (currentIndex >= files.length) currentIndex = 0
  // Detect new file(s) added — only auto-open when a *new* file appears
  // after initial load. On refresh (prevLen==0), just show the icon, don't
  // pop the drawer — user lands in chat and can open via button or when
  // agent adds a new file.
  const hasNew = files.some(f => !prevIds.has(f.id))
  const isNewFileAdded = hasNew && prevLen > 0
  if (isNewFileAdded) {
    currentIndex = 0
    const drawer = document.getElementById('file-viewer-drawer')
    const isDrawerOpen = drawer && !drawer.classList.contains('hidden')
    if (!isDrawerOpen) {
      openDrawer()
    } else {
      // Already open: surface new file immediately
      updateTabs()
      loadFile(currentIndex)
    }
  } else if (prevLen === 0 && files.length > 0) {
    // Initial load (refresh): don't auto-open, just update icon. User can
    // open via floating button, or it will auto-open when agent adds next.
    currentIndex = 0
  } else if (hasNew) {
    currentIndex = 0
  }
  // Only keep loaded set for files still present
  const ids = new Set(files.map(f => f.id))
  for (const id of [...loaded]) {
    if (!ids.has(id)) loaded.delete(id)
  }
  updateIcon()
  const drawer = document.getElementById('file-viewer-drawer')
  if (drawer && !drawer.classList.contains('hidden') && files.length > 0) {
    updateTabs()
    loadFile(currentIndex)
  } else if (drawer && !drawer.classList.contains('hidden') && files.length === 0) {
    const content = drawer.querySelector('.file-viewer-content')
    if (content) content.innerHTML = '<div class="file-viewer-empty">No files pinned</div>'
    updateTabs()
  } else {
    // Drawer hidden: just refresh tabs for next open
    if (files.length > 0) updateTabs()
  }
}

export function init() {
  const { drawer } = ensureElements()
  // Ensure hidden on initial load — user lands in chat, not file view
  if (drawer) drawer.classList.add('hidden')
  updateIcon()
  // Poll for open files (fallback if WS missed) — 3s for near-immediate icon
  setInterval(async () => {
    try {
      const sid = localStorage.getItem('zerowrapper_session') || ''
      if (!sid) return
      const r = await fetch(`/api/files/open?session_id=${encodeURIComponent(sid)}`)
      if (!r.ok) return
      const j = await r.json()
      if (j.files) updateFiles(j.files)
    } catch {}
  }, 3000)
  // Also try WS immediate via file_viewer_update (handled in connection.js)
}
