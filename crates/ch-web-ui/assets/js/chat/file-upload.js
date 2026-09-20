import * as stylex from '@stylexjs/stylex'
import { m } from './messages.stylex.js'
import { fileIconSvg, formatSize, REMOVE_X_SVG } from './attach.js'

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
  const icon = document.createElement('span')
  icon.className = cx(m.chipIcon)
  icon.innerHTML = fileIconSvg(fileInfo.mime_type, fileInfo.filename)
  const name = document.createElement('span')
  name.className = cx(m.chipName)
  name.textContent = fileInfo.filename
  const size = document.createElement('span')
  size.className = cx(m.chipSize)
  size.textContent = formatSize(fileInfo.size)
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'remove-attachment ' + cx(m.removeBtn)
  btn.title = 'Remove'
  btn.setAttribute('aria-label', 'Remove attachment')
  btn.innerHTML = REMOVE_X_SVG
  btn.addEventListener('click', () => {
    chip.remove()
    uploadState.pending = uploadState.pending.filter(a => a.path !== fileInfo.path)
  })
  chip.appendChild(icon)
  chip.appendChild(name)
  chip.appendChild(size)
  chip.appendChild(btn)
  return chip
}
