import { els } from './dom.js'
import { autoScroll } from './scroll.js'
import { createThinkPile, renderStaticThink } from './piles/think.js'
import { createToolPile, renderStaticTool } from './piles/tool.js'
import { pileIdentity } from './icons.js'
import * as overlay from './overlay.js'

// Turn pile: separated narrow sub-piles per turn — one slim thinking pile
// per thinking burst, one pile per tool call as they arrive, mid-response
// bubbles inline via streaming. Same settled CSS classes throughout, so the
// existing stylesheet applies unchanged. Exports match the old module, so
// connection/streaming/tool-calls callers need no changes.
let box = null
let turnOpen = false
let thinkOpen = null
let pileCount = 0
const pending = []

function target() {
  return els.messages || document.getElementById('chat-messages')
}

function ensureBox() {
  const t = target()
  if (!t) return null
  if (!box || !box.isConnected || !turnOpen) {
    box = document.createElement('div')
    box.className = 'turn-activity'
    thinkOpen = null
    pileCount = 0
    pending.length = 0
    turnOpen = true
    t.appendChild(box)
  }
  return box
}

function settleThink() {
  if (thinkOpen) {
    try { thinkOpen.settle() } catch {}
    thinkOpen = null
  }
}

export function pushThought(text) {
  const b = ensureBox()
  if (!b) return
  if (!thinkOpen || !thinkOpen.row.isConnected) {
    thinkOpen = createThinkPile()
    b.appendChild(thinkOpen.row)
    pileCount += 1
  }
  try { thinkOpen.append(text || '') } catch {}
  try { overlay.status('💭', 'Thinking…') } catch {}
  autoScroll()
}

// Kept for API compatibility; thinking bursts settle on tool/result/done now.
export function closeThought() {}

export function pushToolCall(id, name, args) {
  const b = ensureBox()
  if (!b) return
  // A tool call ends the current thinking burst (it gets its own pile next).
  settleThink()
  const note = args && typeof args.note === 'string' ? args.note : ''
  const pile = createToolPile({ name, args, note })
  b.appendChild(pile.row)
  pileCount += 1
  pending.push({ id: id || '', done: pile.done })
  try {
    const idn = pileIdentity(name, args, note)
    overlay.status(idn.icon, idn.label + '…')
  } catch {}
  autoScroll()
}

export function pushToolResult(id, name, output) {
  const idx = pending.findIndex(p => p.id === (id || ''))
  if (idx === -1) return
  const item = pending[idx]
  pending.splice(idx, 1)
  try { item.done(output || '') } catch {}
  try { overlay.status('✅', 'Done') } catch {}
  try { overlay.hideSoon(1200) } catch {}
  autoScroll()
}

export function finishTurn() {
  if (!turnOpen) return
  turnOpen = false
  settleThink()
  // Turns that end with calls still running (error/cancel): settle them
  // instead of leaving eternal spinners.
  while (pending.length > 0) {
    const item = pending.pop()
    try { item.done('') } catch {}
  }
  if (!pileCount && box) {
    box.remove()
    box = null
    try { overlay.hideNow() } catch {}
    return
  }
  try { overlay.hideSoon(1500) } catch {}
}

export function resetTurn() {
  if (box) box.remove()
  box = null
  turnOpen = false
  thinkOpen = null
  pileCount = 0
  pending.length = 0
}

export function pendingCount() {
  return pending.length
}

// Static settled pile for history rendering from a stored trace
// {thinking, thought_count, tools:[{id,name,args,output,note}]}.
// Same builders as live, no live state touched. Appends one
// .turn-activity container; no-op when the trace is empty.
export function renderStaticTrace(container, trace) {
  if (!container || !trace) return null
  const thinking = typeof trace.thinking === 'string' ? trace.thinking : ''
  const tools = Array.isArray(trace.tools) ? trace.tools : []
  if (!thinking.trim() && tools.length === 0) return null
  const wrap = document.createElement('div')
  wrap.className = 'turn-activity'
  if (thinking.trim()) {
    try { renderStaticThink(wrap, thinking, trace.thought_count) } catch {}
  }
  for (const t of tools) {
    try { renderStaticTool(wrap, t || {}) } catch {}
  }
  if (!wrap.hasChildNodes()) return null
  container.appendChild(wrap)
  return wrap
}
