import * as stylex from '@stylexjs/stylex'
import { lb } from './lightbox.stylex.js'

const cx = (...args) => (stylex.props(...args).className || '')

let lightbox = null
let loadingEl = null
let images = []
let currentIndex = 0
let touchStartX = 0

function ensureLightbox() {
  if (!lightbox) {
    lightbox = document.createElement('div')
    lightbox.id = 'lightbox'
    lightbox.className = cx(lb.box, lb.boxClosed)
    const closeBtn = document.createElement('button')
    closeBtn.className = 'lb-close ' + cx(lb.close)
    closeBtn.innerHTML = '&times;'
    const prevBtn = document.createElement('button')
    prevBtn.className = 'lb-prev ' + cx(lb.navBtn, lb.prev, lb.navShown)
    prevBtn.innerHTML = '&#10094;'
    const nextBtn = document.createElement('button')
    nextBtn.className = 'lb-next ' + cx(lb.navBtn, lb.next, lb.navShown)
    nextBtn.innerHTML = '&#10095;'
    loadingEl = document.createElement('div')
    loadingEl.className = 'lb-loading ' + cx(lb.loading)
    loadingEl.textContent = 'Loading...'
    lightbox.appendChild(closeBtn)
    lightbox.appendChild(prevBtn)
    lightbox.appendChild(nextBtn)
    lightbox.appendChild(loadingEl)
    document.body.appendChild(lightbox)
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lb-close')) close()
    })
    lightbox.addEventListener('click', (e) => {
      const btn = e.target.closest('.lb-prev, .lb-next')
      if (!btn) return
      btn.classList.contains('lb-prev') ? navigate(-1) : navigate(1)
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') navigate(-1)
      if (e.key === 'ArrowRight') navigate(1)
    })
    lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX }, { passive: true })
    lightbox.addEventListener('touchend', (e) => {
      const delta = touchStartX - e.changedTouches[0].screenX
      if (delta > 50) navigate(1)
      else if (delta < -50) navigate(-1)
    }, { passive: true })
  }
  return lightbox
}

function close() {
  if (lightbox) {
    lightbox.className = cx(lb.box, lb.boxClosed)
    document.body.style.overflow = ''
    const img = lightbox.querySelector('img')
    if (img) { img.onload = null; img.onerror = null }
  }
}

function navigate(dir) {
  const next = currentIndex + dir
  if (next < 0 || next >= images.length) return
  currentIndex = next
  loadImage(images[currentIndex])
  updateNavButtons()
}

function loadImage(src) {
  const lbEl = ensureLightbox()
  let img = lbEl.querySelector('img')
  if (!img) {
    img = document.createElement('img')
    lbEl.appendChild(img)
  }
  img.className = cx(lb.img, lb.imgHidden)
  img.onload = null
  img.onerror = null
  if (loadingEl) loadingEl.className = 'lb-loading ' + cx(lb.loading, lb.loadingShown)
  img.onload = () => {
    img.className = cx(lb.img, lb.imgShown)
    if (loadingEl) loadingEl.className = 'lb-loading ' + cx(lb.loading, lb.loadingHidden)
  }
  img.onerror = () => {
    if (loadingEl) loadingEl.textContent = 'Failed to load image'
    setTimeout(() => { if (loadingEl) loadingEl.textContent = 'Loading...' }, 2000)
  }
  lbEl.className = cx(lb.box, lb.boxOpen)
  document.body.style.overflow = 'hidden'
  img.src = src
}

function updateNavButtons() {
  if (!lightbox) return
  const prev = lightbox.querySelector('.lb-prev')
  const next = lightbox.querySelector('.lb-next')
  if (prev) prev.className = 'lb-prev ' + cx(lb.navBtn, lb.prev, currentIndex <= 0 ? lb.navHidden : lb.navShown)
  if (next) next.className = 'lb-next ' + cx(lb.navBtn, lb.next, currentIndex >= images.length - 1 ? lb.navHidden : lb.navShown)
}

export function init(messagesEl) {
  messagesEl.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && e.target.closest('.chat-markdown')) {
      const container = e.target.closest('.chat-markdown')
      const imgs = Array.from(container.querySelectorAll('img'))
      images = imgs.map(img => img.src)
      currentIndex = imgs.indexOf(e.target)
      if (currentIndex === -1) currentIndex = 0
      ensureLightbox()
      updateNavButtons()
      loadImage(images[currentIndex])
    }
  })
}
