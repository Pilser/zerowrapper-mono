import { renderBody, renderPins } from './whiteboard-render.js'
import './check.js'
import { initSnap } from './snap.js'

const dataEl = document.getElementById('wb-data')
if (dataEl) {
  const data = JSON.parse(dataEl.textContent)
  renderBody(document.getElementById('wb-root'), data.body_md)
  renderPins(document.getElementById('wb-pins'), data.pins)
}
initSnap()