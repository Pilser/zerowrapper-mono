// Tiny Motion wrappers for pile life: pop-in, float loop, bounce,
// shimmer, countdown bar. All no-ops when Motion is unavailable, and all
// transform/opacity only (GPU-cheap, never layout). One place for motion
// so piles/ stay about structure, not animation code.
import { animate } from './motion.js'

function ok() {
  try {
    return typeof animate === 'function'
  } catch {
    return false
  }
}

// Pop-in on mount: scale + fade, snappy spring-ish ease.
export function popIn(el, opts = {}) {
  if (!el || !ok()) return null
  try {
    return animate(
      el,
      { opacity: [0, 1], scale: [0.92, 1], y: [6, 0] },
      { duration: 0.28, ease: 'circOut', ...(opts.options || {}) }
    )
  } catch {
    return null
  }
}

// Gentle infinite float for icons (entertaining, low motion).
// Returns a stop function.
export function floatLoop(el, distance = 3, duration = 2.2) {
  if (!el || !ok()) return () => {}
  try {
    const controls = animate(
      el,
      { y: [0, -distance, 0] },
      { duration, repeat: Infinity, ease: 'easeInOut' }
    )
    return () => {
      try { controls.stop() } catch {}
    }
  } catch {
    return () => {}
  }
}

// One-shot bounce (new tool pile lands, check pops).
export function bounce(el, scale = 1.12) {
  if (!el || !ok()) return null
  try {
    return animate(el, { scale: [1, scale, 1] }, { duration: 0.35, ease: 'circOut' })
  } catch {
    return null
  }
}

// Shimmer sweep for live text (thinking preview, streaming bubble edge).
// Animates a CSS variable the stylesheet turns into a gradient sweep.
export function shimmer(el) {
  if (!el || !ok()) return null
  try {
    return animate(el, { opacity: [0.55, 1] }, { duration: 0.9, repeat: Infinity, direction: 'alternate', ease: 'easeInOut' })
  } catch {
    return null
  }
}

// Countdown bar for tool timeouts: linear width shrink over budget ms.
// Returns {done} to settle it early (tool finished) or let it run.
export function countdown(barEl, labelEl, budgetMs, elapsedStart = 0) {
  const stopFns = []
  if (!barEl || !ok() || !budgetMs || budgetMs <= 0) return () => {}
  const total = Math.max(1, budgetMs - elapsedStart)
  try {
    const controls = animate(barEl, { scaleX: [1, 0] }, { duration: total / 1000, ease: 'linear' })
    stopFns.push(() => {
      try { controls.stop() } catch {}
    })
  } catch {}
  if (labelEl) {
    const t0 = Date.now() - elapsedStart
    const timer = window.setInterval(() => {
      const left = Math.max(0, budgetMs - (Date.now() - t0))
      const s = Math.ceil(left / 1000)
      try {
        labelEl.textContent = s > 0 ? '0:' + String(s).padStart(2, '0') : 'past budget…'
        if (s <= 10) labelEl.classList.add('cd-warm')
      } catch {}
      if (left <= 0) window.clearInterval(timer)
    }, 500)
    stopFns.push(() => window.clearInterval(timer))
  }
  return () => stopFns.forEach((fn) => {
    try { fn() } catch {}
  })
}
