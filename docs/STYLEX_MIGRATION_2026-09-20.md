# StyleX Migration — How to Translate All Styles and Wire It With Topcoat + Bun

**Date:** 2026-09-20
**Goal:** Let another agent translate all existing styles to StyleX, verified that it will work with Topcoat + Bun as we generate assets in CI, without overriding existing styles until a switch is flipped.

## 1. Current Stack (Single Source of Truth After Fix)

- **One file:** `crates/ch-web-ui/styles.css` is now the single source for `body`/`#chat-messages`/`#bg-canvas`/`#page-root` and all pile/feed/picker chrome. Inline `style="background: ..."` in `layout.rs:73` was changed to `background-color` (and then removed in favor of `class="app-body"` + sheet rule) so the sheet's `background-image: radial-gradient` (dots) is not killed by the shorthand.
- **Tailwind v4 CSS-first:** `@import "tailwindcss"; @source "./src/**/*.rs";` in `styles.css`, no `tailwind.config.*`. Built via `topcoat::tailwind::BuildConfig::new().input("styles.css").render()` in `crates/ch-web-ui/build.rs`.
- **Topcoat asset pipeline:** `src/assets.rs` declares `STYLESHEET: Asset = stylesheet!()` and JS assets via `asset!()`. `topcoat asset bundle --bin zw --release --out <OUT>` scans the binary for `TOPCOAT_ASSET` markers, copies + hashes (`tailwind-<hash>.css`) + writes `manifest.toml`. Served as `?asset=` or `/_topcoat/assets/`. JS is bundled separately via `bun build app-entry.js --format esm --external marked... --outfile app.js` in `crates/ch-web-ui/assets/js/chat/`.

## 2. How StyleX Works (Bun + Topcoat Coexistence — Verified)

StyleX is **not** a runtime CSS-in-JS — it's a Babel compile-time transform that turns `stylex.create()` objects into atomic CSS classes and `stylex.props()` merges. It needs:

- `@stylexjs/stylex` + `@stylexjs/babel-plugin` + `@stylexjs/unplugin` (which has **Bun adapter** via esbuild).
- For Bun production: `await Bun.build({ entrypoints: ['src/main.jsx'], outdir: 'dist', metafile: true, plugins: [stylex.esbuild({ useCSSLayers: true })] })` — confirmed in StyleX docs for Bun (`esbuild` adapter with `Bun.build()`). The plugin aggregates CSS from all transformed modules and **appends it to an existing CSS asset** (or emits `stylex.css` fallback). It also exposes `/virtual:stylex.css` and `virtual:stylex:runtime` for dev HMR.

**Coexistence with Topcoat (no override, one switch):**

- Keep Topcoat/Tailwind exactly as is (`styles.css` + `build.rs` + `assets.rs`). **Add** StyleX as a *second* CSS producer for JS-driven piles/feed/picker.
- In `crates/ch-web-ui/assets/js/chat/build.mjs` (or inline in `ci.yml`'s `bun build` line), add `stylex.esbuild()` **alongside** the existing `bun build` for `app-entry.js`. The plugin will find the StyleX imports in `piles/*.js`/`overlay.js` and emit `stylex.css` next to `app.js`.
- In `crates/ch-web-ui/src/assets.rs`, declare `pub static STYLEX_CSS: Asset = asset!("assets/js/chat/stylex.css");` and in `layout.rs` inject a second `<link rel="stylesheet" href=(stylex_url)>` **after** the Tailwind sheet. Order matters: StyleX atomic classes should come *after* Tailwind so they win without `!important`.
- **Switch:** One boolean in `layout.rs` — `if cfg!(feature = "stylex")` or `if use_stylex { html! { link stylex } }` — controls whether the StyleX sheet is linked. When off, the old `styles.css` piles/feed/picker rules remain. When on, the agent-translated StyleX piles take over. No file is deleted until the switch is proven.

## 3. What the Other Agent Must Do (Step-by-Step)

**Phase 0 — Confirm (must do first, as requested):**
1. In a scratch branch, `npm i -D @stylexjs/stylex @stylexjs/babel-plugin @stylexjs/unplugin` (or `bun add -d`).
2. Add a minimal `stylex.config.js` and a test file `src/test.stylex.js` with `import * as stylex from '@stylexjs/stylex'; const s = stylex.create({ foo: { color: 'red' } });`.
3. Run the existing `bun build app-entry.js ...` with `stylex.esbuild()` added and `metafile:true`; verify `dist/stylex.css` is emitted and `app.js` still builds. If `Bun.build` with `stylex.esbuild` fails, report and stop — do not touch `styles.css`.

**Phase 1 — Translate (mechanical, file by file):**
- For each pile/feed/picker component (`piles/think.js`, `piles/tool.js`, `overlay.js`, `theme-picker.js`, `activity.js` wrappers), replace `element.className = "tool-card ..."` + `styles.css` rules with `import * as stylex from '@stylexjs/stylex'; const styles = stylex.create({ card: { backgroundColor: 'var(--color-bg)', ... }, ... })` and `...stylex.props(styles.card)`.
- Keep `styles.css` **untouched** during translation — the new StyleX CSS will be *additive*. Only after visual parity (screenshot diff) should the old `.tool-card`/`.think-card`/`.agent-feed` rules be deleted.
- Preserve `pileIdentity()` + `resolveNote()` — StyleX styles are static, so keep dynamic text (note/label) as JS, only the chrome (border, shadow, radius, padding, dot size) moves to `stylex.create`.

**Phase 2 — Wire:**
- Update `assets.rs` + `layout.rs` to emit the second sheet as described.
- Keep `build.rs` Tailwind — do not remove `topcoat::tailwind::BuildConfig`. The two pipelines coexist.

## 4. Risks & Mitigations

- **Bun + Topcoat file discovery:** Topcoat scans the Rust binary for `TOPCOAT_ASSET`; StyleX scans JS via `metafile`. They don't conflict — different outdirs (`deploy/assets/` vs `dist/`). Ensure `stylex.css` is copied into Topcoat's `OUT_DIR` or declared as an `asset!` so `topcoat asset bundle` hashes it.
- **Specificity:** StyleX atomic classes are low-specificity (`0,1,0`). Tailwind utilities are similar. Order the `<link>`s: Tailwind first, StyleX second, so StyleX wins without `!important`. Use `stylex.create` priority levels if needed.
- **No need to replace Tailwind wholesale:** Keep `class="flex gap-2"` in Rust for layout; StyleX is for the new floating piles/feed/picker chrome where co-location helps the JS agent. Full replacement is 1000+ lines of `styles.css` + all Rust `class="..."` — do it incrementally, not in one PR.

## 5. Verification

- `cargo check` still passes (StyleX is JS-only, no Rust change).
- `bun build` emits both `app.js` and `stylex.css`; `topcoat asset bundle` still emits `tailwind-<hash>.css` + `manifest.toml` with both entries.
- Visual: `rg --no-heading "stylex" crates/ch-web-ui/assets/js/chat/` shows only new piles using it; old `styles.css` rules for those components are still present but overridden by later StyleX sheet.
