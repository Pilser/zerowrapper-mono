# StyleX Contract — Single Owner, Faithful Translation

**Date:** 2026-09-20
**Decision:** Tailwind stays as a **dumb utility generator for the Rust shell only**. It is not a design system and not a middleman. Every styled DOM subtree has exactly one owner. Translation is **faithful** (same values, new system) — redesigns are separate, explicit commits.
**Companion:** `STYLEX_MIGRATION_2026-09-20.md` (pipeline). **CI: do NOT trigger** — commit + push only after translation is confirmed perfect; Tailwind import dies last, file stays until live-confirmed.

## 1. Ownership table (binding)

| Area | Owner | Status |
|---|---|---|
| Session drawer (`#side-drawer`, items) | **StyleX** (`drawer.stylex.js`, faithful 1:1) | DONE 2026-09-20 — old `#drawer-*`/`.drawer-item*` rules deleted |
| Piles (`think-card`, `tool-card`, `cd-*`) | **StyleX** (`piles/piles.stylex.js` + `tokens.stylex.js`) | DONE 2026-09-20 — faithful, old rules deleted |
| Background: dots + streaming tint + glow | **StyleX** (`bg.stylex.js`, JS `#bg-dots` layer) | DONE 2026-09-20 — replaces `body::before`/`body.streaming`/`@keyframes dots-stream-pulse`; glow filter isolated to the layer (no body filter → fixed-position chrome safe) |
| Accent picker + accent effect | **StyleX** (`theme-picker.stylex.js`); effect via JS `--color-bg-interactive` | DONE 2026-09-20 — replaces `#accent-picker`/`.ap-*`/`.collapsed`/`.selected` + `[data-accent]` (which was silently losing to unlayered `:root`/`[data-theme]` in `@layer base`) |
| Agent feed + status pill | **StyleX** (`overlay.stylex.js`) | DONE 2026-09-20 — replaces `.agent-feed`/`.feed-item`/`.agent-pill*` |
| Message rows/avatars/content + attachment chips | **StyleX** (`messages.stylex.js`) | DONE 2026-09-20 — avatar SVG size moved to constants; `.msg-content`/`.chat-markdown` markers kept |
| Turn-activity container + stream ripple | **StyleX** (`activity.stylex.js`) | DONE 2026-09-20 — dead `.activity-*`/`.action-*` deleted; `::after` text is now a real span |
| Lightbox + mermaid zoom modal | **StyleX** (`lightbox.stylex.js`, `mermaid.stylex.js`) | DONE 2026-09-20 |
| Ask-drawer CARDS (wizard/review/pills/dots/nav) | **StyleX** (`ask.stylex.js`) | DONE 2026-09-20 — textareas got explicit classes; shell `#ask-*` stays (Rust) |
| Whiteboard pins (`whiteboard-pin-card`/`pin-name`/`pin-meta`) | Old sheet | REMAINING — mixed: shared with the pre-bundled `public-wb.js` artifact + descendant selectors on inner `img/iframe/pre/a` |
| Whiteboard arrows (`.whiteboard-arrow`) | Old sheet | BOUNDARY — rendered by Rust (`whiteboard_panel.rs`); cannot StyleX |
| Rust shell layout (`chat_section`, `layout`, whiteboard frame) | Tailwind utilities ONLY | Never colors/borders/shadows |
| Rust inline `style=` (`chat_section`, `whiteboard_panel #snap`, `public_wb`) | Move to owner (StyleX JS-paint or Tailwind) per element | `#snap` double-styled, must pick one (§4) |
| Markdown/typography/hljs, `body`, keyframes, tokens, `@media` page rules | Global sheet (stays permanently) | StyleX has no descendant selectors |

## 2. Hard rules

1. **New styles go in the component's `.stylex.js`.** Never in `styles.css`, never as Tailwind classes in JS — Tailwind scans only `./src/**/*.rs`, so a Tailwind class in JS generates zero CSS and masquerades as a conflict.
2. **Delete-on-cutover.** A component's old rules are deleted in the same commit that ships its StyleX. Old rules are mostly ID selectors (1-0-0) and always beat StyleX atoms (0-1-0) regardless of link order — leaving them guarantees the new style silently loses.
3. **No redesign inside translation.** Same values, new system. Visual diff must be ~zero (screenshot before/after). Redesigns get their own commit after parity.
4. **Debug ladder (no guessing):** devtools Computed → winning rule + layer → owner table → fix is always "wrong owner" or "old rule not deleted." No specificity hacks, no `!important`.
5. **Tokens first:** `tokens.stylex.js` (`defineVars` mirroring `:root`/dark) before component work, so all values reference vars.

## 2a. Token mechanism (verified 2026-09-20 — compiler constraints)

StyleX is strict about cross-module tokens. Findings, in order of discovery:

1. **Plain const module import is rejected.** A `.stylex.js` that `export const T = {bg:'var(--x)'}` and is imported into `stylex.create` fails: *"Could not resolve the path to the imported file. Please ensure that the theme file has a `.stylex.js`/`.stylex.ts` extension and follows the rules for defining variables."* Same for a plain `tokens.js` import.
2. **`defineVars` is the only supported cross-file mechanism.** `stylex.defineVars({ bg: 'var(--color-bg)' })` compiles, emitting `:root, .x<hash> { --x<hash>: var(--color-bg); }` plus `var(--x<hash>)` at use sites.
3. **Indirection keeps styles.css as the single value source.** Because `--x<hash>` is defined as `var(--color-bg)`, and `[data-theme="dark"]` redefines `--color-bg`, dark mode keeps working through late-bound CSS var resolution. No value duplication, no `createTheme` needed.
4. **Never interpolate tokens with `${}`.** Template fragments get hashed into undefined props (`var(--xdfod0m)` with no definition). Composite values (gradients, shadows) must be single literal strings referenced whole.
5. StyleX normalizes colors: `rgba(0,0,0,0.10)` → `#0000001a`, `rgba(0,0,0,0.16)` → `#00000029` (equivalent; not a drift).

## 2a-bis. Same-property conflicts (CRITICAL, verified 2026-09-20)

When two applied classes set the **same property** with different values, StyleX does NOT honor `props()` argument order — the winner is decided by **value sort order in the generated stylesheet** (effectively lexicographic). Verified: `opacity:0` vs `opacity:1` → `1` wins; `display:block` vs `none` → `none` wins; `transform:none` vs `translateX(-105%)` → `translateX` wins.

Consequence: a base value + a state variant is **unsafe**. Example bug caught: drawer base `transform: translateX(-105%)` + `.open { transform: none }` → base always won → drawer never opened.

**Rule: state styles must be mutually exclusive variants with no conflicting base.** Pattern:
```js
base:   { /* shared, NO conflicting property */ },
stateA: { transform: 'translateX(-105%)' },
stateB: { transform: 'none' },
// cx(base, open ? stateB : stateA)  — never cx(baseWithValue, override)
```
Applied to: drawer panel open/closed, bg dots/streaming, lightbox/modal open/closed, feed/pill/dot/pill/nav visibility, message user/assistant variants.

## 2b. Piles cutover (2026-09-20)

- `piles/piles.stylex.js` is a 1:1 port of the v2 card block + `cd-*`. Old rules deleted from `styles.css`.
- **State markers kept as JS hooks** (`open`, `running`, `done`, `hidden`, `cd-warm`) with StyleX variants; `querySelector` hooks (`think-count`, `think-preview`, `think-chev`, `tool-count`, `tool-sub`, `tool-chev`, `cd-label`, `tool-out`) preserved as extra class names alongside atoms.
- **Descendant selectors replaced by repaint.** Old `.open .think-body{display:block}` / `.open .think-chev{rotate}` became explicit `paintOpen()` on click; settle repaints preserve the `open` marker (auto-dismiss checks it).
- **`cd-warm` interception.** `motion-fx.js` (untouched) adds `cd-warm` to the label; a small facade forwards `textContent` + maps `cd-warm` → `p.labelWarm` atom.
- **Quirks preserved exactly:** `.tool-args pre` / `.tool-out pre` matched no element in the old DOM (argsPre IS the `<pre>`), so tool args/output remain unstyled. Flagged, not "fixed" (faithful).
- `USE_STYLEX=true` is now REQUIRED — piles' old rules are gone. Drawer remains on old CSS.

## 3. Resolved 2026-09-20

- **Piles v1 vs v2:** `.tool-pile`/`.think-pile`/`.pile-icon` unreferenced in all source JS + Rust → **deleted** (styles.css was :408-417). `.cd-track/.cd-bar/.cd-label` are live (tool.js countdown) → kept. v2 cards are the only card system.
- **`.running` orphan:** think.js:18 / tool.js:81 mark live cards `running`, settle removes it (tool adds `done`); sheet had `.active` (never added by any JS — verified) and no `.running`. **Renamed the dead `.active` ring rules to `.running`, values untouched.** Live cards now show the intended `status-running` ring; JS untouched.
- **Drawer revert:** first (redesign) cutover reverted to prove the revert path. `drawer.js`, drawer CSS block, and built `app.js` are byte-identical to pre-cutover; `USE_STYLEX=false`; `stylex.css` is a placeholder comment (plugin leaves it untouched while no `.stylex.js` sources exist — verified).
- **Flagged, not yet deleted:** `.thinking-block` block (styles.css ~301-306) unreferenced in JS + Rust — likely dead, delete after one live check that no stored message HTML uses it.

## 4. Known conflicts queued for translation (from audit)

- Generic `.hidden` toggled from JS works today **only via Tailwind's generated utility** (Rust `class="hidden"` keeps it emitted). Every translated component needs a StyleX `hidden` variant before the Tailwind import dies, or all those toggles break silently.
- `#snap` styled in two languages (`whiteboard_panel.rs:56` inline + `snap.js` inline) — pick one owner.
- `main.js` sets `style.display` on the same lines it toggles `hidden` — pick one.
- `#session-bar` triple-killed (`class` + `style` + `!important`) — collapse to one when touched.
- `overlay/piles/motion-fx` inline motion styles override sheet animations — translate values exactly, screenshot-diff motion feel.
- `public-wb.js` duplicates `file-upload`/`snap`/`markdown`/`whiteboard-render` styling — translate both copies together.
- `.attachment-chip`/`.msg-attachments`/`.remove-attachment`/`ap-*` have no sheet rules (inline-only) — first sheet presence will be their StyleX, no deletion needed.
- `body` background split (`61-67` vs `583-593` + streaming) and `#chat-messages` double-defined — consolidate when the globals pass happens.
