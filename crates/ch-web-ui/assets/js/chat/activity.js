import { els } from './dom.js'
import { autoScroll } from './scroll.js'

// One stacked activity fold per assistant turn: a Thinking row and an
// Actions row (tool calls are called "actions" in the UI). Rows stay open
// with live counts while streaming, then settle to a quiet receipt.
// A manual toggle always wins over the automation.
let box = null
let turnOpen = false
let thinkRow = null
let thinkPre = null
let thinkCount = 0
let actRow = null
let actList = null
let actionTotal = 0
const pending = []

const CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'

function target() {
  return els.messages || document.getElementById('chat-messages')
}

function ensureBox() {
  const t = target()
  if (!t) return null
  if (!box || !box.isConnected || !turnOpen) {
    box = document.createElement('div')
    box.className = 'turn-activity'
    thinkRow = null
    thinkPre = null
    thinkCount = 0
    actRow = null
    actList = null
    actionTotal = 0
    pending.length = 0
    turnOpen = true
    t.appendChild(box)
  }
  return box
}

function makeRow(kind, label) {
  const row = document.createElement('div')
  row.className = 'activity-row ' + kind + ' active open'
  const head = document.createElement('button')
  head.className = 'activity-head'
  head.type = 'button'
  head.innerHTML = '<span class="activity-dot"></span><span class="activity-label"></span><span class="activity-num">0</span><span class="activity-chev">' + CHEV + '</span>'
  head.querySelector('.activity-label').textContent = label
  head.addEventListener('click', () => {
    row.classList.toggle('open')
    if (row.classList.contains('open')) row.dataset.pinned = '1'
    else delete row.dataset.pinned
  })
  const detail = document.createElement('div')
  detail.className = 'activity-detail'
  row.appendChild(head)
  row.appendChild(detail)
  return { row, head, detail }
}

function setNum(row, n) {
  const el = row.querySelector('.activity-num')
  if (el) el.textContent = n
}

export function pushThought(text) {
  const b = ensureBox()
  if (!b) return
  if (!thinkRow) {
    const made = makeRow('thinking', 'Thinking')
    thinkRow = made.row
    thinkPre = document.createElement('pre')
    made.detail.appendChild(thinkPre)
    b.appendChild(thinkRow)
  }
  thinkCount += 1
  setNum(thinkRow, thinkCount)
  if (text && thinkPre) thinkPre.textContent += text
  autoScroll()
}

export function pushToolCall(id, name, args) {
  const b = ensureBox()
  if (!b) return
  if (!actRow) {
    const made = makeRow('acting', 'Actions')
    actRow = made.row
    actList = document.createElement('div')
    actList.className = 'action-list'
    made.detail.appendChild(actList)
    b.appendChild(actRow)
  }
  actionTotal += 1
  setNum(actRow, actionTotal)
  const item = document.createElement('div')
  item.className = 'action-item running'
  const argsStr = args ? JSON.stringify(args, null, 2) : ''
  const head = document.createElement('button')
  head.className = 'action-head'
  head.type = 'button'
  head.innerHTML = '<span class="action-status">\u25CC</span><span class="action-name"></span>'
  head.querySelector('.action-name').textContent = name || 'action'
  item.appendChild(head)
  if (argsStr) {
    const detail = document.createElement('div')
    detail.className = 'action-detail hidden'
    const pre = document.createElement('pre')
    pre.textContent = argsStr
    detail.appendChild(pre)
    item.appendChild(detail)
    head.addEventListener('click', () => detail.classList.toggle('hidden'))
  }
  actList.appendChild(item)
  pending.push({ id: id || '', el: item, name })
  autoScroll()
}

export function pushToolResult(id, name, output) {
  const idx = pending.findIndex(p => p.id === (id || ''))
  if (idx === -1) return
  const item = pending[idx]
  pending.splice(idx, 1)
  const status = item.el.querySelector('.action-status')
  if (status) {
    status.className = 'action-status done'
    status.textContent = '\u2713'
  }
  item.el.classList.remove('running')
  item.el.classList.add('done')
  if (output) {
    let detail = item.el.querySelector('.action-detail')
    if (!detail) {
      detail = document.createElement('div')
      detail.className = 'action-detail hidden'
      item.el.appendChild(detail)
      const head = item.el.querySelector('.action-head')
      if (head) head.addEventListener('click', () => detail.classList.toggle('hidden'))
    }
    if (output.length <= 80) {
      const span = document.createElement('div')
      span.className = 'action-output'
      span.textContent = output
      detail.appendChild(span)
      detail.classList.remove('hidden')
    } else {
      const det = document.createElement('details')
      const sum = document.createElement('summary')
      sum.textContent = output.slice(0, 80) + '...'
      const pre = document.createElement('pre')
      pre.textContent = output
      det.appendChild(sum)
      det.appendChild(pre)
      detail.appendChild(det)
    }
  }
  autoScroll()
}

function settleRow(row, receipt) {
  if (!row) return
  row.classList.remove('active')
  const label = row.querySelector('.activity-label')
  if (label) label.textContent = receipt
  if (row.dataset.pinned !== '1') row.classList.remove('open')
}

export function finishTurn() {
  if (!turnOpen) return
  turnOpen = false
  if (!thinkCount && !actionTotal) {
    if (box) box.remove()
    box = null
    return
  }
  if (thinkRow) {
    if (!thinkCount) thinkRow.remove()
    else settleRow(thinkRow, `Thought · ${thinkCount}`)
    thinkRow = null
  }
  if (actRow) {
    if (!actionTotal) actRow.remove()
    else settleRow(actRow, `Actions · ${actionTotal} \u2713`)
    actRow = null
  }
  pending.length = 0
}

export function resetTurn() {
  if (box) box.remove()
  box = null
  turnOpen = false
  thinkRow = null
  thinkPre = null
  thinkCount = 0
  actRow = null
  actList = null
  actionTotal = 0
  pending.length = 0
}

export function pendingCount() {
  return pending.length
}
