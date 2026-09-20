// One floating card per tool call: icon + note/label + count badge,
// expandable args/output. Own .tool-card styles (readable bright text);
// Motion entrance + countdown via motion-fx. `live:false` for history.
import { pileIdentity } from '../icons.js'
import { resolveNote } from '../notes.js'
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

function subForTool(name, args) {
  try {
    const a = args && typeof args === 'object' ? args : null
    if (!a) return ''
    const s = (v) => (typeof v === 'string' ? v : '')
    switch (String(name || '')) {
      case 'bash':
        return head(s(a.command), 90)
      case 'read':
      case 'write':
      case 'edit':
        return head(s(a.path), 90)
      case 'grep':
      case 'find_files':
        return head(s(a.pattern) + (s(a.path) ? ' · ' + s(a.path) : ''), 90)
      case 'subagent':
      case 'task': {
        const ps = Array.isArray(a.prompts) ? a.prompts : []
        return head(s(ps[0]), 90)
      }
      default:
        return ''
    }
  } catch {
    return ''
  }
}

function head(s, n) {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim()
  if (t.length <= n) return t
  return t.slice(0, n) + '…'
}

function attachOutput(body, output) {
  if (!output) return
  let out = body.querySelector('.tool-out')
  if (!out) {
    out = document.createElement('div')
    out.className = 'tool-out'
    body.appendChild(out)
  }
  if (output.length <= 120) {
    out.textContent = output
  } else {
    const det = document.createElement('details')
    const sum = document.createElement('summary')
    sum.textContent = output.slice(0, 120) + '…'
    const pre = document.createElement('pre')
    pre.textContent = output
    det.appendChild(sum)
    det.appendChild(pre)
    out.appendChild(det)
  }
}

export function createToolPile({ name, args, note }, opts = {}) {
  const live = opts.live !== false
  const index = opts.index || ''
  const resolvedNote = resolveNote(name, args, note)
  const { icon, label } = pileIdentity(name, args, resolvedNote || note)
  const card = document.createElement('div')
  card.className = 'tool-card running'
  const headBtn = document.createElement('button')
  headBtn.className = 'tool-head'
  headBtn.type = 'button'
  headBtn.innerHTML = '<span class="tool-icon"></span><span class="tool-title"></span><span class="tool-count"></span><span class="tool-sub"></span><span class="cd-label"></span><span class="tool-chev">' + CHEV + '</span>'
  headBtn.querySelector('.tool-icon').textContent = icon
  headBtn.querySelector('.tool-title').textContent = resolvedNote || label
  const countEl = headBtn.querySelector('.tool-count')
  const subEl = headBtn.querySelector('.tool-sub')
  const cdLabel = headBtn.querySelector('.cd-label')
  if (countEl && index !== '') countEl.textContent = '#' + index
  if (subEl) subEl.textContent = subForTool(name, args)
  const body = document.createElement('div')
  body.className = 'tool-body'
  const argsPre = document.createElement('pre')
  argsPre.className = 'tool-args'
  const aStr = argsText(args)
  if (aStr) {
    argsPre.textContent = aStr
    body.appendChild(argsPre)
  }
  card.appendChild(headBtn)
  card.appendChild(body)
  const cdTrack = document.createElement('div')
  cdTrack.className = 'cd-track hidden'
  const cdBar = document.createElement('div')
  cdBar.className = 'cd-bar'
  cdTrack.appendChild(cdBar)
  card.appendChild(cdTrack)
  headBtn.addEventListener('click', () => {
    card.classList.toggle('open')
  })
  const iconEl = headBtn.querySelector('.tool-icon')
  let stopFloat = () => {}
  let stopCd = () => {}
  if (live) {
    try { popIn(card, { index }) } catch {}
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
    row: card,
    done(output) {
      try { stopFloat() } catch {}
      try { stopCd() } catch {}
      try { cdTrack.classList.add('hidden') } catch {}
      card.classList.remove('running')
      card.classList.add('done')
      attachOutput(body, output || '')
      if (countEl) countEl.textContent = '✓'
      if (subEl && output) subEl.textContent = head(output, 90)
      if (live) {
        try { bounce(card, 1.02) } catch {}
        // Auto-dismiss floating tool tile after a few seconds (history keeps it)
        setTimeout(() => {
          try {
            if (!card.isConnected) return
            if (card.classList.contains('open')) return
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
            card.style.opacity = '0'
            card.style.transform = 'translateY(-8px) scale(0.98)'
            setTimeout(() => { try { card.remove() } catch {} }, 420)
          } catch {}
        }, 5000)
      }
    },
  }
}

// Static settled pile for history rendering from a stored tool step
// {id, name, args, output, note}. Same classes, no loops or timers.
export function renderStaticTool(container, tool, index = '') {
  const t = tool || {}
  const pile = createToolPile({ name: t.name, args: t.args, note: t.note }, { live: false, index })
  pile.done(typeof t.output === 'string' ? t.output : '')
  container.appendChild(pile.row)
  return pile.row
}
