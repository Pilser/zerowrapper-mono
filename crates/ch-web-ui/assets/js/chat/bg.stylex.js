// Full-bleed dotted backdrop + streaming glow, as a StyleX-styled JS
// element (#bg-dots). Replaces body::before / body.streaming: the glow
// `filter` now applies ONLY to this layer, never to page content (a filter
// on body would create a containing block and break position:fixed for the
// picker / piles / whiteboard). Dots + tint read --color-bg-interactive, so
// the accent picker recolors them live.
import * as stylex from '@stylexjs/stylex';
import { t } from './tokens.stylex.js';

const pulse = stylex.keyframes({
  '0%': { filter: 'brightness(1)' },
  '50%': { filter: 'brightness(1.25)' },
  '100%': { filter: 'brightness(1)' },
});

export const bg = stylex.create({
  layer: {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    pointerEvents: 'none',
    backgroundSize: '22px 22px',
    transitionProperty: 'background-image, background-color',
    transitionDuration: '0.6s',
    transitionTimingFunction: 'ease',
  },
  // Mutually exclusive backgrounds (StyleX resolves same-property conflicts
  // by value sort order, so a base backgroundImage + variant would be unsafe).
  dots: {
    backgroundImage: t.dotsBg,
  },
  streaming: {
    backgroundColor: t.streamTint,
    backgroundImage: t.dotsStreamBg,
    animationName: pulse,
    animationDuration: '1.6s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
});
