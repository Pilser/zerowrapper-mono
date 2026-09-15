// Right drawer: the agent's questions. Opens automatically on
// `ask_requested` (buffered event ⇒ survives drops) and via polling backup.
// Full control before submit: every question is editable, options are picks
// or free text, own questions can be added; Review shows the final summary
// with a Back button to keep editing.
import { els } from './dom.js'
import * as network from './network.js'
import { state as authState } from './auth.js'

let current = null // { ask_id, session_id, questions: [{id,question,objective,options,answer,custom}] }
let mode = 'edit' // 'edit' | 'review'
let customCount = 0
let pollTimer = null

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function isOpen() {
  return !!(els.askDrawer && els.askDrawer.classList.contains('open'))
}

export function setOpen(open) {
  if (!els.askDrawer || !els.askOverlay) return
  if (open) {
    els.askDrawer.classList.add('open')
    els.askDrawer.setAttribute('aria-hidden', 'false')
    els.askOverlay.classList.remove('hidden')
  } else {
    els.askDrawer.classList.remove('open')
    els.askDrawer.setAttribute('aria-hidden', 'true')
    els.askOverlay.classList.add('hidden')
  }
}

function setStatus(msg, isError) {
  if (!els.askStatus) return
  els.askStatus.textContent = msg || ''
  els.askStatus.style.color = isError ? 'var(--color-status-error)' : 'var(--color-text-weak)'
}

function readForm() {
  // Pull current inputs back into state (so Review ↔ Back never loses edits).
  if (!current || !els.askBody) return
  const cards = els.askBody.querySelectorAll('[data-qid]')
  cards.forEach((card) => {
    const qid = card.getAttribute('data-qid')
    const q = current.questions.find((x) => x.id === qid)
    if (!q) return
    const qta = card.querySelector('textarea[data-q="text"]')
    if (qta) q.question = qta.value
    const sel = card.querySelector('select[data-q="answer"]')
    const custom = card.querySelector('input[data-q="custom"]')
    const ta = card.querySelector('textarea[data-q="answer"]')
    if (sel && custom) {
      q.answer = (sel.value === '__custom__') ? custom.value : sel.value
    } else if (ta) {
      q.answer = ta.value
    }
  })
}

function answerControl(q) {
  if (q.options && q.options.length > 0) {
    const opts = q.options.map((o) => '<option value="' + esc(o) + '"' + (q.answer === o ? ' selected' : '') + '>' + esc(o) + '</option>').join('')
    const useCustom = q.answer && !q.options.includes(q.answer)
    return '<select data-q="answer">' + opts +
      '<option value="__custom__"' + (useCustom ? ' selected' : '') + '>Custom…</option></select>' +
      '<input data-q="custom" type="text" placeholder="Or type your own…" value="' + esc(useCustom ? q.answer : '') + '"' + (useCustom ? '' : ' style="display:none"') + ' />'
  }
  return '<textarea data-q="answer" rows="2" placeholder="Your answer…">' + esc(q.answer || '') + '</textarea>'
}

function renderEdit() {
  if (!els.askBody || !current) return
  els.askBody.innerHTML = ''
  current.questions.forEach((q) => {
    const card = document.createElement('div')
    card.className = 'ask-card'
    card.setAttribute('data-qid', q.id)
    card.innerHTML =
      (q.objective ? '<div class="ask-objective">' + esc(q.objective) + '</div>' : '') +
      '<textarea data-q="text" rows="2">' + esc(q.question) + '</textarea>' +
      answerControl(q)
    els.askBody.appendChild(card)
  })
  // Show/hide custom inputs under option selects.
  els.askBody.querySelectorAll('select[data-q="answer"]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const card = sel.closest('[data-qid]')
      const custom = card ? card.querySelector('input[data-q="custom"]') : null
      if (custom) custom.style.display = (sel.value === '__custom__') ? '' : 'none'
    })
  })
  els.askBackBtn.classList.add('hidden')
  els.askReviewBtn.classList.remove('hidden')
  els.askSubmitBtn.classList.add('hidden')
  mode = 'edit'
}

function renderReview() {
  readForm()
  if (!els.askBody || !current) return
  els.askBody.innerHTML = ''
  current.questions.forEach((q) => {
    const card = document.createElement('div')
    card.className = 'ask-card ask-review-card'
    card.setAttribute('data-qid', q.id)
    const shownQ = (q.question || '').trim() || '(empty question)'
    const shownA = (q.answer || '').trim() || '— no answer —'
    card.innerHTML =
      '<div class="ask-review-q">' + esc(shownQ) + '</div>' +
      (q.objective ? '<div class="ask-objective">' + esc(q.objective) + '</div>' : '') +
      '<div class="ask-review-a">' + esc(shownA) + '</div>'
    els.askBody.appendChild(card)
  })
  els.askBackBtn.classList.remove('hidden')
  els.askReviewBtn.classList.add('hidden')
  els.askSubmitBtn.classList.remove('hidden')
  mode = 'review'
}

export function openWith(ask) {
  if (!ask || !ask.ask_id) return
  if (current && current.ask_id === ask.ask_id && isOpen()) return
  customCount = 0
  const qs = Array.isArray(ask.questions) ? ask.questions : []
  current = {
    ask_id: ask.ask_id,
    session_id: ask.session_id || authState.sessionId,
    questions: qs.map((q, i) => ({
      id: (q.id && String(q.id)) || ('q' + (i + 1)),
      question: q.question || '',
      objective: q.objective || '',
      options: Array.isArray(q.options) ? q.options.filter((o) => typeof o === 'string').slice(0, 12) : [],
      answer: '',
      custom: false,
    })),
  }
  setStatus('')
  renderEdit()
  setOpen(true)
}

function addOwnQuestion() {
  if (!current) return
  readForm()
  customCount += 1
  current.questions.push({
    id: 'custom-' + customCount,
    question: '',
    objective: '',
    options: [],
    answer: '',
    custom: true,
  })
  if (mode === 'review') renderEdit()
  else renderEdit()
  // Focus the new card's question box.
  try {
    const cards = els.askBody.querySelectorAll('[data-qid]')
    const last = cards[cards.length - 1]
    const ta = last ? last.querySelector('textarea[data-q="text"]') : null
    if (ta) ta.focus()
  } catch {}
}

async function submit() {
  readForm()
  if (!current) return
  const answers = current.questions.map((q) => ({
    id: q.id,
    question: q.question,
    answer: q.answer || '',
  }))
  const body = JSON.stringify({ id: current.ask_id, answers })
  setStatus('Submitting…')
  for (const url of ['/api/ask/answer', '?api=ask_answer']) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.ok) {
        setStatus('Sent — the agent continues.')
        const done = current
        current = null
        setTimeout(() => { setOpen(false); setStatus('') }, 900)
        return done
      }
      if (r.status === 410 || r.status === 404) {
        setStatus('Already resolved — closing.', true)
        current = null
        setTimeout(() => { setOpen(false); setStatus('') }, 900)
        return null
      }
    } catch {}
  }
  setStatus('Submit failed — network issue? Answers are kept; retry.', true)
  return null
}

async function pollPending() {
  try {
    if (network.getState() !== network.State.CONNECTED) return
    const sid = authState.sessionId || localStorage.getItem('zerowrapper_session') || ''
    if (!sid) return
    for (const url of ['/api/ask/pending?session_id=' + encodeURIComponent(sid), '?api=ask_pending&session_id=' + encodeURIComponent(sid)]) {
      try {
        const r = await fetch(url)
        if (!r.ok) continue
        const j = await r.json().catch(() => ({}))
        const list = j.pending || []
        if (list.length > 0 && !isOpen()) {
          const first = list[0]
          let questions = []
          try { questions = JSON.parse(first.questions || '[]') } catch {}
          openWith({ ask_id: first.id, session_id: first.session_id, questions })
        }
        return
      } catch {}
    }
  } catch {}
}

export function init() {
  if (els.askCloseBtn) els.askCloseBtn.addEventListener('click', () => setOpen(false))
  if (els.askOverlay) els.askOverlay.addEventListener('click', () => setOpen(false))
  if (els.askAddBtn) els.askAddBtn.addEventListener('click', addOwnQuestion)
  if (els.askBackBtn) els.askBackBtn.addEventListener('click', renderEdit)
  if (els.askReviewBtn) els.askReviewBtn.addEventListener('click', () => { if (current) renderReview() })
  if (els.askSubmitBtn) els.askSubmitBtn.addEventListener('click', submit)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false)
  })
  // Backup for missed push events (reconnects): poll while connected.
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(pollPending, 15000)
  // Catch up on anything asked while we were away.
  setTimeout(pollPending, 4000)
}
