// One pile per tool call: separated floating block with icon + note/label,
// expandable args/output. Reuses the settled .activity-row.acting and
// .action-item classes; floating lift + motion come from .tool-pile CSS
// and motion-fx (pop/bounce/countdown), kept out of structure code.
import { pileIdentity } from '../icons.js'
import { popIn, bounce, floatLoop, countdown } from '../motion-fx.js'

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
// `live:false` skips loops/timers (history rendering).
export function createToolPile({ name, args, note }, opts = {}) {
  const live = opts.live !== false
  const { icon, label } = pileIdentity(name, args, note)
  const row = document.createElement('div')
  row.className = 'activity-row acting active tool-pile'
  const head = document.createElement('button')
  head.className = 'activity-head'
  head.type = 'button'
  head.innerHTML = '<span class="activity-dot"></span><span class="pile-icon"></span><span class="activity-label"></span><span class="activity-num"></span><span class="cd-label"></span><span class="activity-chev">' + CHEV + '</span>'
  head.querySelector('.pile-icon').textContent = icon
  head.querySelector('.activity-label').textContent = label
  const iconEl = head.querySelector('.pile-icon')
  const cdLabel = head.querySelector('.cd-label')
  const detail = document.createElement('div')
  detail.className = 'activity-detail'
  const list = document.createElement('div')
  list.className = 'action-list'
  detail.appendChild(list)
  row.appendChild(head)
  row.appendChild(detail)
  // Countdown track (only visible while a timeout runs).
  const cdTrack = document.createElement('div')
  cdTrack.className = 'cd-track hidden'
  const cdBar = document.createElement('div')
  cdBar.className = 'cd-bar'
  cdTrack.appendChild(cdBar)
  row.appendChild(cdTrack)
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
  // Lively mount: pop-in once; icon floats while running (live only).
  // Timeout countdown runs when args carry a budget (live only).
  let stopFloat = () => {}
  let stopCd = () => {}
  if (live) {
    try { popIn(row) } catch {}
    try { stopFloat = floatLoop(iconEl, 2.5, 2.0) } catch {}
    const budget = args && typeof args.timeout === 'number' ? args.timeout : 0
    if (budget > 0) {
      try {
        cdTrack.classList.remove('hidden')
        stopCd = countdown(cdBar, cdLabel, budget)
      } catch {}
    }
  }
  return {
    row,
    done(output) {
      try { stopFloat() } catch {}
      try { stopCd() } catch {}
      try { cdTrack.classList.add('hidden') } catch {}
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
      if (live) {
        try { bounce(status || row, 1.15) } catch {}
      }
    },
  }
}

// Static settled pile for history rendering from a stored tool step
// {id, name, args, output, note}. Same classes, no loops or timers.
export function renderStaticTool(container, tool) {
  const t = tool || {}
  const pile = createToolPile({ name: t.name, args: t.args, note: t.note }, { live: false })
  pile.done(typeof t.output === 'string' ? t.output : '')
  container.appendChild(pile.row)
  return pile.row
}
