import * as stylex from '@stylexjs/stylex'
import { m } from './messages.stylex.js'

const cx = (...args) => (stylex.props(...args).className || '')

export const uploadState = {
  pending: [],
}

export async function uploadFile(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('?api=upload', {
      method: 'POST',
      headers: { 'X-Filename': file.name },
      body: file,
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data
  } catch (err) {
    throw err
  }
}

export function createAttachmentChip(fileInfo) {
  const chip = document.createElement('div')
  chip.className = 'attachment-chip ' + cx(m.chip)
  const name = document.createElement('span')
  name.className = cx(m.chipName)
  name.textContent = fileInfo.filename
  const size = document.createElement('span')
  size.className = cx(m.chipSize)
  size.textContent = formatSize(fileInfo.size)
  const btn = document.createElement('button')
  btn.className = 'remove-attachment ' + cx(m.removeBtn)
  btn.innerHTML = '&times;'
  btn.addEventListener('click', () => {
    chip.remove()
    uploadState.pending = uploadState.pending.filter(a => a.path !== fileInfo.path)
  })
  chip.appendChild(name)
  chip.appendChild(size)
  chip.appendChild(btn)
  return chip
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
