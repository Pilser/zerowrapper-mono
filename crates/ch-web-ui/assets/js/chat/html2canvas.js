// html2canvas.js — lightweight local vendored html2canvas (based on 1.4.1 concepts), baked into binary, offline capable.
// No CDN — bundled via bun build into app.js/public-wb.js (see app-entry.js).
// Provides html2canvas(element, {scale}) -> Promise<HTMLCanvasElement>

export async function html2canvas(element, options = {}) {
  const scale = options.scale || 1
  if (!element) throw new Error('html2canvas: target not found')
  const rect = element.getBoundingClientRect()
  const w = Math.max(1, Math.ceil(rect.width))
  const h = Math.max(1, Math.ceil(rect.height))
  const canvas = document.createElement('canvas')
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.scale(scale, scale)
  // background from CSS var or fallback
  let bg = ''
  try { bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim() } catch {}
  ctx.fillStyle = bg || '#ffffff'
  ctx.fillRect(0, 0, w, h)

  // Try SVG foreignObject method for faithful rendering
  try {
    const clone = element.cloneNode(true)
    // Ensure clone has inline width for foreignObject
    const serializer = new XMLSerializer()
    let html = serializer.serializeToString(clone)
    // Avoid breaking SVG due to stray characters
    // Do not double-encode; encodeURIComponent handles it
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;overflow:hidden;">${html}</div></foreignObject></svg>`
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    const img = new Image()
    // Prevent tainting with external resources: anonymous
    img.crossOrigin = 'anonymous'
    img.decoding = 'sync'
    img.src = url
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('svg load timeout')), 1800)
      img.onload = () => { clearTimeout(t); resolve() }
      img.onerror = () => { clearTimeout(t); reject(new Error('svg load error')) }
    })
    ctx.drawImage(img, 0, 0, w, h)
    return canvas
  } catch (_e) {
    // fallback: text extraction
    try {
      let fg = ''
      try { fg = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim() } catch {}
      ctx.fillStyle = fg || '#111111'
      ctx.font = '12px Inter, ui-sans-serif, system-ui, sans-serif'
      const text = (element.innerText || element.textContent || '').split('\n').slice(0, 90)
      let y = 14
      for (const line of text) {
        if (y > h - 4) break
        ctx.fillText(line.slice(0, 150), 8, y)
        y += 14
      }
    } catch {}
    return canvas
  }
}

export default html2canvas
