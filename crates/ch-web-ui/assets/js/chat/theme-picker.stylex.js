// Accent picker — StyleX only. Replaces the #accent-picker / .ap-* rules
// that lived in styles.css. The accent EFFECT is applied from JS by setting
// --color-bg-interactive on <html> (theme-picker.js), so no [data-accent]
// CSS is needed and the value wins over :root/[data-theme] inline.
import * as stylex from '@stylexjs/stylex';
import { t } from './tokens.stylex.js';

export const tp = stylex.create({
  wrap: {
    position: 'fixed',
    top: '12px',
    right: '12px',
    zIndex: 70,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px',
    borderRadius: '999px',
    backgroundColor: t.pickerBg,
    backdropFilter: 'blur(8px)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: t.borderWeak,
    boxShadow: t.pickerShadow,
  },
  list: {
    display: 'flex',
    gap: '8px',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  listCollapsed: {
    display: 'none',
  },
  toggle: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: t.bg,
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: `0 0 0 1px ${t.borderWeak}`,
  },
  item: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    borderStyle: 'none',
    cursor: 'pointer',
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: 'transparent',
    outlineOffset: '2px',
    padding: 0,
  },
  itemSelected: {
    outlineColor: t.textStrong,
  },
  // Per-accent colors (dynamic selection stays static styles).
  cBlue: { backgroundColor: '#3b82f6' },
  cPink: { backgroundColor: '#ec4899' },
  cSun: { backgroundColor: '#eab308' },
  cMint: { backgroundColor: '#10b981' },
  cOrange: { backgroundColor: '#ff8c00' },
});

export const ACCENT_STYLE = {
  blue: tp.cBlue,
  pink: tp.cPink,
  sun: tp.cSun,
  mint: tp.cMint,
  orange: tp.cOrange,
};
