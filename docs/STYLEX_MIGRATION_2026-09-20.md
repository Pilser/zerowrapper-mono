# StyleX Migration — How to Translate All Styles and Wire It With Topcoat + Bun

**Date:** 2026-09-20 (revised: local-first, no CI trigger yet)
**Goal:** Translate styles to StyleX incrementally, verified locally first. No CI change and no override of existing styles until a switch is flipped and local build proves out.

## 0. Ground rule for this phase (LOCAL FIRST, CI WIRED 2026-09-20)

- CI is now wired (`ci.yml`: UI cache covers `app.js` + `stylex.css`, `bun install --frozen-lockfile`, bundle via `bun build.mjs`) but NOT yet triggered — new files are still uncommitted.
- Do NOT run `cargo build --release` for deploy yet except via the explicit CI trigger below. `cargo check -p ch-web-ui` (fast, dev profile) is allowed as a sanity check — passes 2026-09-20.
- All proof so far is on disk: `bun build.mjs` emits both `app.js` and `stylex.css` next to `app-entry.js` (proven, see §4).
- Trigger = commit + push (release build + `topcoat asset bundle` run on main/master/workflow_dispatch only). Before that, confirm `manifest.toml` expectations in Phase 2.

## 1. Current Stack (Single Source of Truth)

- **One file:** `crates/ch-web-ui/styles.css` is the single source for `body`/`#chat-messages`/`#bg-canvas`/`#page-root` and all pile/feed/picker chrome. Tailwind v4 CSS-first: `@import "tailwindcss"; @source "./src/**/*.rs";`, no `tailwind.config.*`.
- **Tailwind build:** `topcoat::tailwind::BuildConfig::new().input("styles.css").render()` in `crates/ch-web-ui/build.rs` writes `$OUT_DIR/tailwind.css`. Served via `stylesheet!()` (= `asset!(concat!(env!("OUT_DIR"), "/tailwind.css"))`) declared as `STYLESHEET` in `src/assets.rs`, linked in `src/components/layout.rs`.
- **JS build (CI today, `ci.yml:72-78`):** one-liner, no `package.json`, no deps:
  ```bash
  cd crates/ch-web-ui/assets/js/chat
  bun build app-entry.js --format esm --external marked --external highlight.js --external katex --external mermaid --outfile app.js
  ```
  Runs BEFORE `cargo build` so the binary embeds fresh `app.js`. `app.js` itself is committed and declared inline in `layout.rs` via `asset!("assets/js/chat/app.js")` (not in `assets.rs`).
- **Bundle:** `topcoat asset bundle --bin zw --release --out bundle-assets` scans the binary for `TOPCOAT_ASSET` markers, copies + hashes + writes `manifest.toml`. Bundle and binary must come from the same build/profile/checkout.
- **Entry:** `assets/js/chat/app-entry.js` imports only JS (`main.js`, `whiteboard.js`, `check.js`, `snap.js`) — no CSS import today.

## 2. How StyleX Works With Bun (Verified Against stylexjs.com Docs)

StyleX is a compile-time Babel transform (`stylex.create()` → atomic classes, `stylex.props()` merge). It needs `@stylexjs/stylex` + `@stylexjs/unplugin` (Bun adapter via the `esbuild` entrypoint).

Production pattern from the official Bun guide:

```js
import stylex from '@stylexjs/unplugin';
await Bun.build({
  entrypoints: ['src/main.jsx'],
  outdir: 'dist',
  target: 'browser',
  metafile: true, // REQUIRED: lets the plugin locate Bun's emitted CSS asset
  plugins: [stylex.esbuild({ useCSSLayers: true })],
});
```

Plugin aggregates CSS from all transformed modules and **appends it to an existing CSS asset, or emits `stylex.css` fallback**. Docs also state: import a CSS file from the root entry so Bun emits a stylesheet to append to; dev HMR uses `bunfig.toml [serve.static] plugins = ["@stylexjs/unplugin/bun"]` plus `/virtual:stylex.css` (dev only, not needed for this phase).

**CORRECTION vs first draft of this doc:** `bun build` on the CLI accepts NO plugins. You cannot "add `stylex.esbuild()` to the CLI line". You MUST replace the one-liner with a `build.mjs` that calls `Bun.build()` with `plugins: [stylex.esbuild(...)]`. That is why Phase 0 below creates `build.mjs` and leaves `ci.yml` untouched until local proof passes.

**Coexistence with Topcoat (no override, one switch):**

- Keep Topcoat/Tailwind exactly as is (`styles.css` + `build.rs` + `assets.rs`). ADD StyleX as a second CSS producer for JS-driven piles/feed/picker.
- `build.mjs` (local, next to `app-entry.js`) runs the existing bundle with `stylex.esbuild()` added. The plugin finds StyleX imports in `piles/*.js`/`overlay.js` and emits `stylex.css` next to `app.js` (fallback path, since `app-entry.js` imports no CSS today — Phase 0 confirms the exact filename on disk).
- `src/assets.rs` declares `pub static STYLEX_CSS: Asset = asset!("assets/js/chat/stylex.css");` and `layout.rs` injects a second `<link rel="stylesheet" href=(stylex_url)>` AFTER the Tailwind sheet. Order matters: Tailwind first, StyleX second, so StyleX wins without `!important`. `useCSSLayers: true` adds `@layer` ordering on top.
- **Switch (off by default):** `if cfg!(feature = "stylex")` or a `use_stylex: bool` controls whether the StyleX sheet is linked. When off, old `styles.css` rules remain authoritative. No file is deleted until the switch is proven. For this local phase the switch stays OFF — the link is wired but not served until we flip it deliberately.

## 3. What To Do (Local-First, Step-by-Step)

**Phase 0 — Prove locally (do this now, no CI):**

1. `cd crates/ch-web-ui/assets/js/chat && bun init -y` (or hand-write minimal `package.json`), then:
   `bun add -d @stylexjs/stylex @stylexjs/unplugin` — first npm deps in this repo, so a lockfile appears here. Do NOT add a CI install step yet.
2. Add `build.mjs` (see §4) calling `Bun.build()` with `stylex.esbuild({ useCSSLayers: true })`, same entry/externals as the CI one-liner.
3. Add `src/test.stylex.js`-equivalent probe: `test.stylex.js` next to `app-entry.js` with `import * as stylex from '@stylexjs/stylex'; export const s = stylex.create({ foo: { color: 'red' } });` and import it once from `app-entry.js` behind a comment (or a dedicated probe entry) — remove before real translation.
4. Run `bun build.mjs` locally; verify BOTH `app.js` and `stylex.css` are emitted and `app.js` still boots. Inspect `stylex.css` contains the probe class. If `Bun.build` + `stylex.esbuild` fails, report and stop — do not touch `styles.css`, `assets.rs`, or `layout.rs`.
5. `cargo check -p ch-web-ui` must still pass (StyleX is JS-only until wiring lands).

**Phase 1 — Translate (mechanical, file by file, switch OFF):**

- For each pile/feed/picker component (`piles/think.js`, `piles/tool.js`, `overlay.js`, `theme-picker.js`, `activity.js` wrappers), replace `element.className = "tool-card ..."` + `styles.css` rules with `import * as stylex from '@stylexjs/stylex'; const styles = stylex.create({ card: { backgroundColor: 'var(--color-bg)', ... } })` and `...stylex.props(styles.card)`.
- Keep `styles.css` UNTOUCHED during translation — new StyleX CSS is additive. Only after visual parity (screenshot diff) are old `.tool-card`/`.think-card`/`.agent-feed` rules deleted.
- Preserve `pileIdentity()` + `resolveNote()` — StyleX styles are static, so keep dynamic text as JS; only chrome (border, shadow, radius, padding, dot size) moves to `stylex.create`.

**Phase 2 — Wire + CI (CI wiring DONE 2026-09-20, trigger pending):**

- `assets.rs` + `layout.rs` second sheet behind the off-by-default switch: DONE (`STYLEX_CSS`, `USE_STYLEX = false`). Keep `build.rs` Tailwind.
- `ci.yml`: DONE — `bun install --frozen-lockfile` on cache miss, `bun build.mjs` replaces the CLI one-liner, UI cache covers `app.js` + `stylex.css` (generated files excluded from the key, lockfile included via `chat/**`).
- Trigger (separate, explicit step): commit `package.json` + `bun.lock` + `build.mjs` + probe + `stylex.css` and push (or `workflow_dispatch`). Release build + `topcoat asset bundle` then run on the runner — confirm `manifest.toml` contains both `tailwind-<hash>.css` and `stylex-<hash>.css`.

## 4. Reference: local `build.mjs` (mirrors CI one-liner + StyleX)

```js
// crates/ch-web-ui/assets/js/chat/build.mjs — LOCAL ONLY for now, ci.yml untouched
import stylex from '@stylexjs/unplugin';

const result = await Bun.build({
  entrypoints: ['./app-entry.js'],
  outdir: '.',
  naming: { entry: 'app.js' },
  format: 'esm',
  target: 'browser',
  external: ['marked', 'highlight.js', 'katex', 'mermaid'],
  metafile: true,
  plugins: [stylex.esbuild({ useCSSLayers: true })],
});
if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log('outputs:', result.outputs.map((o) => o.path));
```

Run: `cd crates/ch-web-ui/assets/js/chat && bun build.mjs`. Expected: `app.js` + `stylex.css` in the same dir.

Observed 2026-09-20 (bun 1.4.0, `@stylexjs/unplugin` 0.19.1): `result.outputs` lists only `app.js`; `stylex.css` (55 bytes, `@layer priority1 { .x1e2nbdu { color: red } }`) is written as a plugin side effect. Rebuilt `app.js` was byte-identical to committed (probe export is tree-shaken from JS while its CSS still emits) — real components using `stylex.props()` will be retained in JS.

## 5. Risks & Mitigations

- **CLI vs API:** `bun build` CLI cannot load `stylex.esbuild()`. Any plan that keeps the one-liner will silently skip StyleX. `build.mjs` is mandatory.
- **First deps:** repo has no `package.json`; adding StyleX adds install/lockfile overhead and a future CI `bun install` step. Keep it scoped to `assets/js/chat/`.
- **CSS entry:** `app-entry.js` imports no CSS, so expect the `stylex.css` fallback file, not an append. Confirm the emitted filename in Phase 0 before writing the `asset!` path.
- **Ordering:** `stylex.css` must exist BEFORE `cargo build` so `asset!` resolves and `topcoat bundle` hashes it (same rule as `app.js` today). Local `cargo check` (dev) does not produce the release bundle — release + bundle inspection waits for the explicit CI step.
- **Specificity:** StyleX atomic classes are low-specificity (`0,1,0`), same as Tailwind utilities. `<link>` order (Tailwind first, StyleX second) + `useCSSLayers: true` decides conflicts. Use `stylex.create` priority levels if needed.
- **Scope:** Keep `class="flex gap-2"` in Rust; StyleX is for floating piles/feed/picker chrome where co-location helps. Full Tailwind replacement is 1000+ lines + all Rust classes — incremental, not one PR.

## 6. Verification (local phase — superseded by §7 cutover)

## 7. First cutover: session drawer (Sessions list) — 2026-09-20

- Session/agent-history list = client-rendered JS: `drawer.js renderList()` builds `button > span.title + span.meta` into `#drawer-list`; shell (`#side-drawer`, header, actions, label, usage) is Rust in `chat_section.rs:75-93` with IDs as JS hooks (`dom.js:28-33`).
- New files: `assets/js/chat/drawer.stylex.js` (`stylex.create`, accent-orange theme: gradient New-chat button, orange section labels/title, active session = tinted bg + orange border + inset accent bar). `drawer.js` applies via `stylex.props` (`cx()` helper); open/closed + overlay visibility are StyleX variants (`panelOpen/panelClosed/overlayHidden`), `open`/`hidden` markers kept for `isOpen()` logic only.
- Cut over: old `#side-drawer`/`.drawer-item*` rules deleted from `styles.css` (legacy `#session-bar` kill + layout guards stay). IDs unchanged. Probe (`test.stylex.js`) removed.
- `USE_STYLEX = true` in `layout.rs` → second `<link>` ships after Tailwind.
- Local proof: `bun build.mjs` → `stylex.css` 3772 bytes / 37 atomic classes (gradient, inset bar, `translateX(-105%)` all present); `cargo check -p ch-web-ui` passes. Commit triggers CI release + `topcoat asset bundle`; verify `manifest.toml` lists `stylex-<hash>.css` and the running drawer shows the new theme.

- `bun build.mjs` emits both `app.js` and `stylex.css`; `stylex.css` contains the probe.
- `cargo check -p ch-web-ui` passes (switch OFF, old styles authoritative).
- `git status` shows NO change to `.github/workflows/ci.yml`, `styles.css` rules intact, old piles still styled by `styles.css`.
- `rg --no-heading "stylex" crates/ch-web-ui/assets/js/chat/` shows only `build.mjs` + probe + new piles using it.
