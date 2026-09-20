// Design tokens as StyleX theme variables (defineVars). Each value points
// at the existing CSS custom property, so styles.css :root /
// [data-theme="dark"] remains the SINGLE source of values; StyleX only
// adds a hashed indirection (--x*: var(--color-*)) that is late-bound, so
// theme switching keeps working. Cross-file token imports REQUIRE this
// defineVars form — plain const modules are rejected by the compiler
// (verified 2026-09-20).
import * as stylex from '@stylexjs/stylex';

export const t = stylex.defineVars({
  bg: 'var(--color-bg)',
  bgWeak: 'var(--color-bg-weak)',
  bgWeakHover: 'var(--color-bg-weak-hover)',
  bgStrong: 'var(--color-bg-strong)',
  bgStrongHover: 'var(--color-bg-strong-hover)',
  bgInteractive: 'var(--color-bg-interactive)',
  bgInteractiveWeak: 'var(--color-bg-interactive-weak)',
  accentLighter: 'var(--color-accent-lighter)',
  accentDarker: 'var(--color-accent-darker)',
  accentNeon: 'var(--color-accent-neon)',
  text: 'var(--color-text)',
  textWeak: 'var(--color-text-weak)',
  textWeaker: 'var(--color-text-weaker)',
  textStrong: 'var(--color-text-strong)',
  textInverted: 'var(--color-text-inverted)',
  border: 'var(--color-border)',
  borderWeak: 'var(--color-border-weak)',
  statusSuccess: 'var(--color-status-success)',
  statusError: 'var(--color-status-error)',
  statusRunning: 'var(--color-status-running)',
  fontSans: 'var(--font-sans)',
  fontMono: 'var(--font-mono)',
  // Composite literals — reference WHOLE, never interpolate with ${}:
  // interpolated fragments get hashed into undefined props (verified).
  pileCardBg:
    'linear-gradient(180deg, var(--color-bg-weak), var(--color-bg))',
  pileCardShadow:
    '0 3px 12px rgba(0,0,0,0.10), 0 0 0 1px var(--color-border-weak)',
  pileCardRunningShadow:
    '0 4px 18px rgba(0,0,0,0.16), 0 0 0 1px var(--color-status-running)',
  cdBarBg:
    'linear-gradient(90deg, var(--color-status-running), var(--color-status-success))',
  // Background layer (dots + streaming tint) and accent picker.
  dotsBg:
    'radial-gradient(circle, color-mix(in srgb, var(--color-bg-interactive) 38%, transparent) 1.7px, transparent 1.9px)',
  dotsStreamBg:
    'radial-gradient(circle, var(--color-bg-interactive) 2.2px, transparent 2.4px)',
  streamTint:
    'color-mix(in srgb, var(--color-bg-interactive) 14%, var(--color-bg))',
  pickerBg: 'color-mix(in srgb, var(--color-bg) 84%, transparent)',
  pickerShadow: '0 2px 10px rgba(0,0,0,0.10)',
  pillBg: 'color-mix(in srgb, var(--color-bg) 82%, transparent)',
  feedItemShadow: '0 4px 16px rgba(0,0,0,0.14)',
  pillShadow: '0 6px 24px rgba(0,0,0,0.16)',
});
