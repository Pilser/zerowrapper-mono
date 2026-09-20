// Right drawer: the agent's questions. Opens automatically on
// `ask_requested` (buffered event ⇒ survives drops) and via polling backup.
// Wizard: one question per view, Back/Next dots, pills → answer box,
// sticky mobile Submit. Answers live only in REST payload, never as chat.
import { els } from './dom.js'
import * as network from './network.js'
import { state as authState } from './auth.js'

let current = null // { ask_id, session_id, kind, questions: [{id,question,objective,options,answer}] }
let wizardIndex = 0
let mode = 'edit' // 'edit' | 'review'
let customCount = 0
let pollTimer = null
let pendingQueue = [] // for multi-ask (main + 2 subagents)

function isSystemAsk() {
  return !!(current && (current.kind === 'system-continue' || String(current.ask_id || '').startsWith('continue-')))
}

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

function saveCurrentCard() {
  if (!current || !els.askBody) return
  const card = els.askBody.querySelector('[data-qid]')
  if (!card) return
  const qid = card.getAttribute('data-qid')
  const q = current.questions.find((x) => x.id === qid)
  if (!q) return
  const qta = card.querySelector('textarea[data-q="text"]')
  if (qta) q.question = qta.value
  const ta = card.querySelector('textarea[data-q="answer"]')
  if (ta) q.answer = ta.value
}

function answerControl(q) {
  let pills = ''
  if (q.options && q.options.length > 0) {
    pills = '<div class="ask-pills">' + q.options.map((o) => {
      const sel = q.answer === o ? ' selected' : ''
      return '<button type="button" class="ask-pill' + sel + '" data-q="pick" data-val="' + esc(o) + '">' + esc(o) + '</button>'
    }).join('') + '</div>'
  }
  return pills + '<textarea data-q="answer" rows="3" placeholder="Type your answer…">' + esc(q.answer || '') + '</textarea>'
}

function renderWizard() {
  if (!els.askBody || !current) return
  const total = current.questions.length
  if (total === 0) {
    els.askBody.innerHTML = '<div class="ask-empty">No questions</div>'
    return
  }
  // Clamp index
  if (wizardIndex < 0) wizardIndex = 0
  if (wizardIndex >= total) wizardIndex = total - 1
  const q = current.questions[wizardIndex]
  const isFirst = wizardIndex === 0
  const isLast = wizardIndex === total - 1

  // Dots
  let dots = ''
  if (total > 1) {
    dots = '<div class="ask-dots">' + current.questions.map((_, i) => {
      const active = i === wizardIndex ? ' active' : ''
      const answered = current.questions[i].answer && current.questions[i].answer.trim() ? ' answered' : ''
      return '<button type="button" class="ask-dot' + active + answered + '" data-dot="' + i + '" aria-label="Question ' + (i+1) + '"></button>'
    }).join('') + '</div>'
  }

  // Header
  let header = ''
  if (isSystemAsk()) {
    header = '<div class="ask-system-banner"><div class="ask-system-title">⏸️ Agent paused</div><div class="ask-system-sub">Long turn, no final answer yet. Continue for another full budget, or stop here — the committed summary stays.</div></div>'
  } else if (pendingQueue.length > 1) {
    header = '<div class="ask-queue-banner">' + pendingQueue.length + ' pending asks — viewing ' + (wizardIndex+1) + '/' + total + ' of current</div>'
  } else if (total > 1) {
    header = '<div class="ask-wizard-header">Question ' + (wizardIndex+1) + ' of ' + total + dots + '</div>'
  } else {
    header = dots
  }

  const card = document.createElement('div')
  card.className = 'ask-card ask-wizard-card'
  card.setAttribute('data-qid', q.id)
  card.innerHTML = header +
    (q.objective ? '<div class="ask-objective">' + esc(q.objective) + '</div>' : '') +
    '<label class="ask-q-label">Question</label><textarea data-q="text" rows="2">' + esc(q.question) + '</textarea>' +
    '<label class="ask-a-label">Your answer</label>' + answerControl(q)

  els.askBody.innerHTML = ''
  if (total > 1 && !isSystemAsk() && pendingQueue.length <= 1) {
    // For single ask with multiple questions, show header dots also at top
    // (already in card, but keep)
  }
  els.askBody.appendChild(card)

  // Pills → answer box
  card.querySelectorAll('button[data-q="pick"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = card.querySelector('textarea[data-q="answer"]')
      if (box) {
        box.value = btn.getAttribute('data-val') || ''
        try { box.focus() } catch {}
        // Update state immediately for dots
        saveCurrentCard()
        // Update pill selection
        card.querySelectorAll('button[data-q="pick"]').forEach((s) => s.classList.toggle('selected', s === btn))
        updateWizardNav()
      }
    })
  })

  // Dot navigation (save current before jumping)
  els.askBody.querySelectorAll('button[data-dot]').forEach((dot) => {
    dot.addEventListener('click', () => {
      saveCurrentCard()
      const idx = parseInt(dot.getAttribute('data-dot') || '0', 10)
      wizardIndex = idx
      renderWizard()
    })
  })

  // Nav buttons
  const nav = document.createElement('div')
  nav.className = 'ask-wizard-nav'
  nav.innerHTML = '<button type="button" class="ask-nav-btn" data-nav="back"' + (isFirst ? ' disabled' : '') + '>← Back</button>' +
    '<span class="ask-nav-count">' + (wizardIndex+1) + ' / ' + total + '</span>' +
    '<button type="button" class="ask-nav-btn primary" data-nav="next">' + (isLast ? 'Review →' : 'Next →') + '</button>'
  els.askBody.appendChild(nav)

  nav.querySelectorAll('button[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-nav')
      saveCurrentCard()
      if (dir === 'back' && wizardIndex > 0) {
        wizardIndex--
        renderWizard()
      } else if (dir === 'next') {
        if (isLast) {
          renderReview()
        } else {
          wizardIndex++
          renderWizard()
        }
      }
    })
  })

  // Focus answer box on mobile after render
  try {
    const ta = card.querySelector('textarea[data-q="answer"]')
    if (ta && window.innerWidth < 600) {
      // Don't auto-focus on desktop to avoid scroll jump, but on mobile it's helpful
      // ta.focus() // keep commented to avoid keyboard pop on every nav
    }
  } catch {}

  updateWizardNav()
  els.askBackBtn.classList.add('hidden')
  els.askReviewBtn.classList.add('hidden')
  els.askSubmitBtn.classList.remove('hidden')
  mode = 'edit'

  // If wizard has publish, ensure submit is visible
  try { els.askSubmitBtn.style.display = '' } catch {}
}

function updateWizardNav() {
  // Update dots answered state without full re-render
  if (!current || !els.askBody) return
  els.askBody.querySelectorAll('button[data-dot]').forEach((dot, i) => {
    const q = current.questions[i]
    if (q && q.answer && q.answer.trim()) dot.classList.add('answered')
    else dot.classList.remove('answered')
  })
}

function renderReview() {
  saveCurrentCard()
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
  // Back should return to wizard at last index, not stacked edit
  els.askBackBtn.onclick = () => {
    wizardIndex = current.questions.length - 1
    renderWizard()
  }
}

export function openWith(ask) {
  if (!ask || !ask.ask_id) return
  if (current && current.ask_id === ask.ask_id && isOpen()) return
  // If drawer already open with different ask, queue it
  if (current && current.ask_id !== ask.ask_id) {
    // Check if already in queue
    if (!pendingQueue.find((x) => x.ask_id === ask.ask_id)) {
      pendingQueue.push({
        ask_id: ask.ask_id,
        session_id: ask.session_id || authState.sessionId,
        kind: ask.kind || 'model',
        questions: Array.isArray(ask.questions) ? ask.questions : [],
      })
    }
    // Don't auto-switch, just update indicator
    setStatus(pendingQueue.length + ' pending asks')
    return
  }
  customCount = 0
  const qs = Array.isArray(ask.questions) ? ask.questions : []
  current = {
    ask_id: ask.ask_id,
    session_id: ask.session_id || authState.sessionId,
    kind: ask.kind || 'model',
    questions: qs.map((q, i) => ({
      id: (q.id && String(q.id)) || ('q' + (i + 1)),
      question: q.question || '',
      objective: q.objective || '',
      options: Array.isArray(q.options) ? q.options.filter((o) => typeof o === 'string').slice(0, 12) : [],
      answer: '',
      custom: false,
    })),
  }
  wizardIndex = 0
  // Also populate queue for multi-ask header
  pendingQueue = [{ ask_id: current.ask_id, kind: current.kind, questions: qs }]
  setStatus('')
  renderWizard()
  setOpen(true)
}

function addOwnQuestion() {
  if (!current) return
  saveCurrentCard()
  customCount += 1
  current.questions.push({
    id: 'custom-' + customCount,
    question: '',
    objective: '',
    options: [],
    answer: '',
    custom: true,
  })
  wizardIndex = current.questions.length - 1
  renderWizard()
  try {
    const ta = els.askBody.querySelector('textarea[data-q="text"]')
    if (ta) ta.focus()
  } catch {}
}

async function submit() {
  saveCurrentCard()
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
        const resolvedId = done ? done.ask_id : ''
        try { window.dispatchEvent(new CustomEvent('askResolved', { detail: { ask_id: resolvedId } })) } catch {}
        current = null
        pendingQueue = pendingQueue.filter((x) => x.ask_id !== resolvedId)
        // If queue has more, open next
        if (pendingQueue.length > 0) {
          const next = pendingQueue[0]
          let qs = []
          try { qs = Array.isArray(next.questions) ? next.questions : JSON.parse(next.questions || '[]') } catch {}
          // Reconstruct ask object
          setTimeout(() => openWith({ ask_id: next.ask_id, session_id: next.session_id, questions: qs, kind: next.kind }), 300)
        }
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
        // Update queue
        pendingQueue = list.map((x) => {
          let qs = []
          try { qs = typeof x.questions === 'string' ? JSON.parse(x.questions) : (Array.isArray(x.questions) ? x.questions : []) } catch {}
          return { ask_id: x.id, session_id: x.session_id, questions: qs, kind: x.kind || 'model' }
        })
        if (list.length > 0 && !isOpen()) {
          const first = list[0]
          let questions = []
          try { questions = typeof first.questions === 'string' ? JSON.parse(first.questions) : (Array.isArray(first.questions) ? first.questions : []) } catch {}
          openWith({ ask_id: first.id, session_id: first.session_id, questions, kind: first.kind || 'model' })
        } else if (list.length > 1 && isOpen() && current) {
          // Update banner count without switching
          setStatus(list.length + ' pending asks — finish current to see next')
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
  if (els.askBackBtn) els.askBackBtn.addEventListener('click', () => {
    if (mode === 'review') {
      wizardIndex = Math.max(0, current ? current.questions.length - 1 : 0)
      renderWizard()
    } else if (wizardIndex > 0) {
      saveCurrentCard()
      wizardIndex--
      renderWizard()
    }
  })
  if (els.askReviewBtn) els.askReviewBtn.addEventListener('click', () => { if (current) renderReview() })
  if (els.askSubmitBtn) els.askSubmitBtn.addEventListener('click', submit)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false)
  })
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(pollPending, 15000)
  setTimeout(pollPending, 4000)
}
