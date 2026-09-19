// One pile per tool call: separated narrow block with icon + note/label,
// expandable args/output. Reuses the settled .activity-row.acting and
// .action-item classes so the existing stylesheet applies unchanged.
import { pileIdentity } from '../icons.js'

const CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'

function argsText(args) {
  if (!args) return ''
  try {
    return JSON.stringify(args, null, 2)
  } catch {
    return String(args)
  }
}

function attachOutput(item, output) {
  if (!output) return
  let detail = item.querySelector('.action-detail')
  if (!detail) {
    detail = document.createElement('div')
    detail.className = 'action-detail hidden'
    item.appendChild(detail)
    const head = item.querySelector('.action-head')
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

// Live pile for one tool call. `note` is the agent-written note when present
// (else the derived label). Starts narrow-collapsed but `active`.
export function createToolPile({ name, args, note }) {
  const { icon, label } = pileIdentity(name, args, note)
  const row = document.createElement('div')
  row.className = 'activity-row acting active'
  const head = document.createElement('button')
  head.className = 'activity-head'
  head.type = 'button'
  head.innerHTML = '<span class="activity-dot"></span><span class="activity-label"></span><span class="activity-num"></span><span class="activity-chev">' + CHEV + '</span>'
  head.querySelector('.activity-label').textContent = icon + ' ' + label
  const detail = document.createElement('div')
  detail.className = 'activity-detail'
  const list = document.createElement('div')
  list.className = 'action-list'
  detail.appendChild(list)
  row.appendChild(head)
  row.appendChild(detail)
  head.addEventListener('click', () => {
    row.classList.toggle('open')
    if (row.classList.contains('open')) row.dataset.pinned = '1'
    else delete row.dataset.pinned
  })
  const item = document.createElement('div')
  item.className = 'action-item running'
  const itemHead = document.createElement('button')
  itemHead.className = 'action-head'
  itemHead.type = 'button'
  itemHead.innerHTML = '<span class="action-status">◌</span><span class="action-name"></span>'
  itemHead.querySelector('.action-name').textContent = name || 'action'
  item.appendChild(itemHead)
  const aStr = argsText(args)
  if (aStr) {
    const aDetail = document.createElement('div')
    aDetail.className = 'action-detail hidden'
    const pre = document.createElement('pre')
    pre.textContent = aStr
    aDetail.appendChild(pre)
    item.appendChild(aDetail)
    itemHead.addEventListener('click', () => aDetail.classList.toggle('hidden'))
  }
  list.appendChild(item)
  const num = head.querySelector('.activity-num')
  return {
    row,
    done(output) {
      const status = item.querySelector('.action-status')
      if (status) {
        status.className = 'action-status done'
        status.textContent = '✓'
      }
      item.classList.remove('running')
      item.classList.add('done')
      attachOutput(item, output || '')
      if (num) num.textContent = '✓'
      row.classList.remove('active')
      if (row.dataset.pinned !== '1') row.classList.remove('open')
    },
  }
}

// Static settled pile for history rendering from a stored tool step
// {id, name, args, output, note}. Same classes, no live wiring.
export function renderStaticTool(container, tool) {
  const t = tool || {}
  const pile = createToolPile({ name: t.name, args: t.args, note: t.note })
  pile.done(typeof t.output === 'string' ? t.output : '')
  container.appendChild(pile.row)
  return pile.row
}
