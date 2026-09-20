// Message rows (user/assistant/error) + attachment chips. Faithful 1:1 port
// of the #chat-messages > .message-row* rules and the inline chip styles.
// Markers `msg-content` / `chat-markdown` / `msg-avatar` are kept as query
// hooks (messages.js:188, lightbox.js) and for the markdown CSS that stays.
import * as stylex from '@stylexjs/stylex';
import { t } from './tokens.stylex.js';

const cx = (...args) => (stylex.props(...args).className || '');

const slideIn = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

export const m = stylex.create({
  row: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
    animationName: slideIn,
    animationDuration: '0.2s',
    animationTimingFunction: 'ease-out',
  },
  rowUser: { alignItems: 'flex-end' },
  rowAssistant: { alignItems: 'center' },
  avatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  // svg uses stroke="currentColor", so `color` drives the icon stroke.
  avatarUser: {
    backgroundColor: t.bgInteractive,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: t.borderWeak,
    color: t.textInverted,
  },
  avatarAssistant: {
    backgroundColor: t.bgWeak,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: t.borderWeak,
    color: t.textWeak,
  },
  content: {
    padding: '12px 16px',
    fontSize: '0.875rem',
    lineHeight: '1.75',
    overflowWrap: 'break-word',
    borderRadius: '10px',
    width: '100%',
    boxSizing: 'border-box',
  },
  contentUser: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: t.borderWeak,
    color: t.textInverted,
    fontWeight: 450,
    backgroundColor: t.bgInteractive,
    borderBottomRightRadius: '4px',
    maxWidth: '75%',
    width: 'auto',
  },
  contentAssistant: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: t.borderWeak,
    color: t.text,
    backgroundColor: t.bg,
    borderBottomLeftRadius: '4px',
    maxWidth: '64rem',
  },
  // attachment chips (messages.js + file-upload.js + snap.js)
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: t.borderWeak,
    backgroundColor: t.bgWeak,
    fontSize: '0.75rem',
    marginBottom: '4px',
  },
  chipName: { color: t.textStrong },
  chipSize: { color: t.textWeak, fontSize: '0.625rem' },
  removeBtn: {
    backgroundColor: 'transparent',
    borderStyle: 'none',
    cursor: 'pointer',
    color: t.statusError,
    fontSize: '0.875rem',
    padding: 0,
    lineHeight: 1,
  },
  textTop: { margin: '6px 0 0' },
  textPlain: { margin: 0 },
});

export const rowClass = (role) =>
  cx(m.row, role === 'user' && m.rowUser, role === 'assistant' && m.rowAssistant);

export const avatarClass = (role) =>
  'msg-avatar ' + cx(m.avatar, role === 'user' ? m.avatarUser : m.avatarAssistant);

export const contentClass = (role, markdown) =>
  'msg-content ' +
  (markdown ? 'chat-markdown ' : '') +
  cx(
    m.content,
    role === 'user' ? m.contentUser : role === 'assistant' ? m.contentAssistant : null
  );
