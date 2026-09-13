// acorn.js — tiny baked JS parser glue, no CDN. Provides window.acorn.parse that delegates to new Function for line:col.
// In production you could replace this with the real acorn/oxc_parser.wasm (+ glue) baked here.
// This stub keeps the bundle offline and gives better errors than none.
try {
  window.acorn = window.acorn || {
    parse(code, opts) {
      try {
        // eslint-disable-next-line no-new-func
        new Function(String(code))
      } catch (e) {
        // Attach loc if possible (estimate line:col from stack)
        const msg = e && e.message ? e.message : String(e)
        // Try to extract line from message like "Unexpected token (1:5)"
        const m = /\(?(\d+):(\d+)\)?/.exec(msg)
        if (m) e.loc = { line: parseInt(m[1], 10), column: parseInt(m[2], 10) }
        throw e
      }
    }
  }
} catch {}
export const acorn = (typeof window !== 'undefined' && window.acorn) ? window.acorn : null
