// Faithful StyleX translation of the floating piles (think-card,
// tool-card, cd-*). Values are 1:1 from styles.css v2 block + cd-* rules
// (v1 dead rules deleted, never ported). Known quirks preserved exactly:
// - `.tool-args pre` matched nothing in the old DOM (argsPre IS the pre),
//   so tool args get NO pre chrome — flagged in contract, not "fixed" here.
// - `.tool-out pre` (output block) likewise unstyled — preserved.
// - `open`/`running`/`done`/`hidden`/`cd-warm` stay as JS state markers;
//   visuals are variants below. Old ID-free class selectors had no
//   specificity traps, so delete-on-cutover is safe.
import * as stylex from '@stylexjs/stylex';
import { t } from '../tokens.stylex.js';

export const p = stylex.create({
  card: {
    borderRadius: '16px',
    backgroundImage: t.pileCardBg,
    boxShadow: t.pileCardShadow,
    overflow: 'hidden',
    willChange: 'transform, opacity',
  },
  cardRunning: {
    boxShadow: t.pileCardRunningShadow,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '7px 12px',
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    borderWidth: 0,
    borderStyle: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    lineHeight: 1.45,
    color: t.textStrong,
    textAlign: 'left',
  },
  icon: {
    fontSize: '1.05rem',
    lineHeight: 1,
    flexShrink: 0,
    display: 'inline-block',
    willChange: 'transform',
  },
  title: {
    fontWeight: 700,
    color: t.textStrong,
    whiteSpace: 'nowrap',
  },
  count: {
    fontFamily: t.fontMono,
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: t.bg,
    backgroundColor: t.statusRunning,
    borderRadius: '999px',
    padding: '1px 8px',
    lineHeight: 1.6,
    flexShrink: 0,
  },
  countDone: {
    backgroundColor: t.statusSuccess,
  },
  preview: {
    color: t.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
    flex: 1,
  },
  chev: {
    marginLeft: 'auto',
    color: t.textWeak,
    display: 'inline-flex',
    transitionProperty: 'transform',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
    flexShrink: 0,
  },
  chevOpen: {
    transform: 'rotate(180deg)',
  },
  body: {
    padding: '2px 12px 10px',
  },
  bodyClosed: {
    display: 'none',
  },
  bodyOpen: {
    display: 'block',
  },
  thinkPre: {
    fontSize: '0.75rem',
    fontFamily: t.fontMono,
    lineHeight: 1.55,
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: t.text,
    maxHeight: '220px',
    overflowY: 'auto',
    backgroundColor: t.bg,
    borderRadius: '8px',
    padding: '8px 10px',
  },
  toolOut: {
    fontSize: '0.75rem',
    color: t.text,
    marginTop: '6px',
  },
  det: {
    marginTop: '6px',
  },
  sum: {
    fontSize: '0.75rem',
    color: t.text,
    cursor: 'pointer',
  },
  cdTrack: {
    height: '3px',
    borderRadius: '999px',
    backgroundColor: t.borderWeak,
    margin: '0 10px 6px',
    overflow: 'hidden',
  },
  trackHidden: {
    display: 'none',
  },
  cdBar: {
    height: '100%',
    width: '100%',
    borderRadius: '999px',
    backgroundImage: t.cdBarBg,
    transformOrigin: 'left center',
  },
  cdLabel: {
    fontFamily: t.fontMono,
    fontSize: '0.625rem',
    color: t.textWeak,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  labelWarm: {
    color: t.statusError,
    fontWeight: 700,
  },
});
