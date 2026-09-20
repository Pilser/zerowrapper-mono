// Turn-activity container + stream ripple loader. Faithful 1:1 port of
// .turn-activity / .stream-ripple* / .ripple* rules. The old ::after text
// ("Agent working…") is now a real child span (StyleX can't do pseudo-
// elements).
import * as stylex from '@stylexjs/stylex';
import { t } from './tokens.stylex.js';

const textPulse = stylex.keyframes({
  '0%': { opacity: 1 },
  '100%': { opacity: 1 },
  '50%': { opacity: 0.6 },
});

export const a = stylex.create({
  turnActivity: {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '64rem',
    margin: '0 auto 4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  streamRipple: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '18px 0',
  },
  rippleText: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: t.text,
    animationName: textPulse,
    animationDuration: '1.4s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
  rippleContainer: {
    position: 'relative',
    width: '90px',
    height: '40px',
    flexShrink: 0,
  },
  ripple: {
    position: 'absolute',
    top: '2px',
    left: 0,
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    borderWidth: '4px',
    borderStyle: 'solid',
    borderColor: t.bgInteractive,
    opacity: 0,
    willChange: 'transform, opacity',
    boxShadow:
      '0 0 12px color-mix(in srgb, var(--color-bg-interactive) 45%, transparent)',
  },
});
