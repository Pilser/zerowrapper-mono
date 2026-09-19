// Per-tool notes: agent-written `note` always wins; otherwise derive a
// deterministic one-liner from structured args. Derived notes work on old
// traces too (args were always stored). No LLM, no backend change.
import { parseCli } from './icons.js'

function head(s, n = 64) {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim()
  if (t.length <= n) return t
  return t.slice(0, n) + '…'
}

function str(v) {
  return typeof v === 'string' ? v : ''
}

export function deriveNote(name, args) {
  const a = args && typeof args === 'object' ? args : {}
  switch (String(name || '')) {
    case 'bash': {
      const cmd = str(a.command)
      if (!cmd.trim()) return ''
      const cli = parseCli(cmd)
      if (cli && cli.binary) return head(cli.binary + (cli.subcommand ? ' ' + cli.subcommand : ''));
      return head(cmd, 64)
    }
    case 'read': {
      let s = str(a.path)
      if (a.offset != null || a.limit != null) s += ` (lines ${a.offset || 1}–${a.limit ? (Number(a.offset) || 1) + Number(a.limit) - 1 : '…'})`
      return head(s, 72)
    }
    case 'write':
      return head(str(a.path) ? 'write ' + str(a.path) : '', 72)
    case 'edit':
      return head(str(a.path) ? 'edit ' + str(a.path) : '', 72)
    case 'grep':
      return head(str(a.pattern) + (str(a.path) ? ' in ' + str(a.path) : ''), 72)
    case 'find_files':
    case 'list_dir':
      return head(str(a.pattern || a.path), 72)
    case 'subagent':
    case 'task': {
      const ps = Array.isArray(a.prompts) ? a.prompts : []
      return head(str(ps[0]), 72)
    }
    case 'inspect': {
      const bits = [str(a.action), str(a.kind), str(a.check), str(a.target)].filter(Boolean)
      return head(bits.join(' · ') || 'inspect', 72)
    }
    case 'ask_user': {
      const qs = Array.isArray(a.questions) ? a.questions : []
      const q0 = qs[0]
      return head(typeof q0 === 'string' ? q0 : (q0 && q0.question) || 'question', 72)
    }
    case 'todo_write':
      return 'plan update'
    case 'manage_whiteboard':
    case 'manage_materials': {
      const bits = Object.values(a).filter((v) => typeof v === 'string' && v && v !== 'note').slice(0, 2)
      return head(bits.join(' · '), 72)
    }
    default:
      return ''
  }
}

// Final note for a pile header: agent-written wins, else derived, else "".
export function resolveNote(name, args, agentNote) {
  const a = (agentNote && String(agentNote).trim()) || ''
  if (a) return a
  try {
    return deriveNote(name, args)
  } catch {
    return ''
  }
}
