// Deterministic tool + CLI icon registry. No LLM, no backend change:
// everything derives from structured tool name + args. Unknown tools and
// binaries fall back to generic glyphs so the pile never renders blank.
const TOOL_ICONS = {
  bash: '⌨️',
  read: '📄',
  write: '✏️',
  edit: '🛠️',
  grep: '🔍',
  find_files: '🗂️',
  list_dir: '📁',
  subagent: '🤖',
  task: '🤖',
  inspect: '👁️',
  check: '🧪',
  test: '🧪',
  manage_whiteboard: '📌',
  manage_materials: '📚',
  todo_write: '☑️',
  ask_user: '❓',
  generate_file_urls: '🔗',
  get_file_paths: '🔗',
  memory_write: '🧠',
  memory_read: '🧠',
  memory_edit: '🧠',
  memory_search: '🧠',
}

// CLI binary -> icon. Shell piles show [icon] binary · subcommand.
const CLI_ICONS = {
  engram: '🧠',
  hubengram: '🛰️',
  portfolio: '💼',
  hubportfolio: '🏢',
  git: '🌿',
  npm: '📦',
  bun: '🥟',
  cargo: '🦀',
  docker: '🐳',
  kubectl: '☸️',
  curl: '🌐',
  wget: '🌐',
  ssh: '🔐',
  python: '🐍',
  python3: '🐍',
  pip: '📦',
  pytest: '🧪',
  node: '🟢',
  zw: '⚡',
  ls: '📁',
  cat: '📄',
  grep: '🔍',
  find: '🗂️',
  sleep: '⏳',
  echo: '💬',
}

// Normalize a tool name: strip MCP `mcp__` namespace prefixes, lowercase.
// Keeps matching robust when providers rename or namespace tools.
function normName(name) {
  let n = String(name || '').toLowerCase()
  while (n.startsWith('mcp__')) n = n.slice(5)
  return n
}

// Inspect sub-action: check/test runs get the test tube, navigation keeps
// the eye. Reads structured args (action/kind/check/target/steps).
function inspectIdentity(args) {
  const vals = []
  try {
    for (const k of ['action', 'kind', 'check', 'target']) {
      const v = args && args[k]
      if (typeof v === 'string') vals.push(v.toLowerCase())
    }
    const steps = args && args.steps
    if (Array.isArray(steps)) {
      for (const s of steps) {
        if (s && typeof s.action === 'string') vals.push(String(s.action).toLowerCase())
      }
    }
  } catch {}
  const joined = vals.join(' ')
  if (/(^|[\s_-])(test|check|assert|verify)/.test(joined)) return { icon: '🧪', label: 'test' }
  if (/whiteboard[-_ ](open|next|prev)/.test(joined)) return { icon: '👁️', label: 'whiteboard' }
  if (/screenshot|snap/.test(joined)) return { icon: '📸', label: 'screenshot' }
  if (/automation|e2e/.test(joined)) return { icon: '🎬', label: 'automation' }
  return { icon: TOOL_ICONS.inspect, label: 'inspect' }
}

function splitArgs(cmd) {
  // Minimal shell-aware tokenize (quotes, backslash). `&&`, `||`, `;`
  // become their own tokens so `cd dir && real-cmd` keeps working; a
  // lone `|`/`&` (pipe/background) ends the first command.
  const out = []
  let cur = ''
  let q = null
  const flush = () => { if (cur) { out.push(cur); cur = '' } }
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i]
    if (q) {
      if (ch === '\\' && i + 1 < cmd.length) { cur += cmd[++i]; continue }
      if (ch === q) { q = null; continue }
      cur += ch
      continue
    }
    if (ch === '\\' && i + 1 < cmd.length) { cur += cmd[++i]; continue }
    if (ch === '"' || ch === "'") { q = ch; continue }
    if (/\s/.test(ch) || ch === '\n') { flush(); continue }
    if (ch === ';') { flush(); out.push(';'); continue }
    if ((ch === '&' || ch === '|') && cmd[i + 1] === ch) {
      flush(); out.push(ch + ch); i++
      continue
    }
    if (ch === '&' || ch === '|') break
    cur += ch
  }
  flush()
  return out
}

// Parse a shell command into {binary, subcommand}. Strips leading
// `cd DIR &&`, env assignments (A=b), and sudo/timeout wrappers.
export function parseCli(command) {
  if (!command || typeof command !== 'string') return null
  let parts = splitArgs(command.trim())
  while (parts.length > 0) {
    const head = parts[0]
    if (head === '&&' || head === '||' || head === ';') { parts = parts.slice(1); continue }
    const base = head.split('/').pop()
    if (base === 'cd') {
      // `cd dir` + optional `&&`: drop both, keep the real command.
      parts = parts.slice(2)
      if (parts[0] === '&&') parts = parts.slice(1)
      continue
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(head)) { parts = parts.slice(1); continue }
    if (base === 'sudo' || base === 'timeout' || base === 'env' || base === 'bash' || base === 'sh') {
      parts = parts.slice(1)
      if (parts[0] === '-c') parts = parts.slice(1)
      continue
    }
    break
  }
  if (!parts.length) return null
  const binary = parts[0].split('/').pop()
  let subcommand = ''
  for (let i = 1; i < parts.length; i++) {
    const t = parts[i]
    if (!t || t === '&&' || t === '||' || t === ';') break
    if (t.startsWith('-')) continue
    subcommand = t.replace(/^["']|["']$/g, '')
    break
  }
  return { binary, subcommand }
}

// Header identity for a tool pile: agent-written note wins, else a
// compact derived label. Returns {icon, label} — label is short words.
export function pileIdentity(name, args, note) {
  const cleanNote = (note && String(note).trim()) || ''
  const n = normName(name)
  if (n === 'bash' && args && typeof args.command === 'string') {
    const cli = parseCli(args.command)
    if (cli && cli.binary) {
      const icon = CLI_ICONS[cli.binary] || '⌨️'
      const label = cleanNote || (cli.binary + (cli.subcommand ? ' · ' + cli.subcommand : ''))
      return { icon, label }
    }
    return { icon: TOOL_ICONS.bash, label: cleanNote || 'shell' }
  }
  if (n === 'inspect') {
    const sub = inspectIdentity(args)
    return { icon: sub.icon, label: cleanNote || sub.label }
  }
  const icon = TOOL_ICONS[n] || '⚙️'
  const label = cleanNote || String(name || 'action')
  return { icon, label }
}
