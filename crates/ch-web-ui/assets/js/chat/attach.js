// File-type icons + size formatting for attachment chips. Feather-style
// stroke SVGs (currentColor) so they match the app's icon language instead
// of emojis. Used by the picker chip (file-upload.js) and the sent-message
// chip (messages.js).
export function formatSize(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / (1024 * 1024)).toFixed(1) + ' MB'
}

function svg(inner) {
  return (
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'
  )
}

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'heic']
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'mpeg', 'mpg']
const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac']
const TEXT_EXT = ['txt', 'md', 'log', 'csv', 'json', 'xml', 'yaml', 'yml', 'rs', 'js', 'ts', 'py', 'sh', 'html', 'css', 'toml']
const ARCHIVE_EXT = ['zip', 'tar', 'gz', 'tgz', 'rar', '7z', 'bz2']

// Pick an icon by MIME first, extension second, generic file last.
export function fileIconSvg(mime, name) {
  const m = String(mime || '').toLowerCase()
  const n = String(name || '').toLowerCase()
  const ext = n.includes('.') ? n.split('.').pop() : ''
  if (m.startsWith('image/') || IMAGE_EXT.includes(ext)) {
    return svg('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>')
  }
  if (m.startsWith('video/') || VIDEO_EXT.includes(ext)) {
    return svg('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>')
  }
  if (m.startsWith('audio/') || AUDIO_EXT.includes(ext)) {
    return svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>')
  }
  if (m === 'application/pdf' || ext === 'pdf') {
    return svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>')
  }
  if (m.startsWith('text/') || m === 'application/json' || m === 'application/xml' || TEXT_EXT.includes(ext)) {
    return svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>')
  }
  if (ARCHIVE_EXT.includes(ext)) {
    return svg('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>')
  }
  return svg('<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>')
}

export const REMOVE_X_SVG =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
  '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
