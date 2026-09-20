// Live status pill + recent-action feed (overlay.js). 1:1 port of the
// .agent-pill / .agent-feed / .feed-item rules that were in styles.css.
import * as stylex from '@stylexjs/stylex';
import { t } from './tokens.stylex.js';

export const ov = stylex.create({
  feed: {
    position: 'fixed',
    right: '14px',
    bottom: '150px',
    zIndex: 60,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxWidth: '240px',
    pointerEvents: 'none',
  },
  feedHidden: {
    display: 'none',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '5px 11px',
    borderRadius: '999px',
    backgroundColor: t.pickerBg,
    backdropFilter: 'blur(8px)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: t.borderWeak,
    boxShadow: t.feedItemShadow,
    fontSize: '0.6875rem',
    color: t.textStrong,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    willChange: 'transform, opacity',
  },
  pill: {
    position: 'fixed',
    left: '50%',
    bottom: '86px',
    transform: 'translateX(-50%)',
    zIndex: 60,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '999px',
    backgroundColor: t.pillBg,
    backdropFilter: 'blur(8px)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: t.border,
    boxShadow: t.pillShadow,
    fontSize: '0.75rem',
    color: t.text,
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  },
  pillHidden: {
    display: 'none',
  },
  icon: {
    fontSize: '1rem',
    lineHeight: 1,
  },
});
