// #bg-dots: the single background layer (dots + streaming tint + glow).
// StyleX-styled; streaming toggled from activity.js on agent turns.
import * as stylex from '@stylexjs/stylex';
import { bg } from './bg.stylex.js';

const cx = (...args) => (stylex.props(...args).className || '');

let el = null;

export function init() {
  if (el && el.isConnected) return;
  el = document.createElement('div');
  el.id = 'bg-dots';
  el.setAttribute('aria-hidden', 'true');
  el.className = cx(bg.layer, bg.dots);
  document.body.appendChild(el);
}

export function setStreaming(on) {
  if (!el) init();
  if (!el) return;
  el.className = cx(bg.layer, on ? bg.streaming : bg.dots);
}
