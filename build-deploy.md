# Build & Deploy (zerowrapper-mono, no docker)

Flow: edit → push → CI builds → download binary + bundle → copy → restart → verify.
The binary and its asset bundle are built by CI (`.github/workflows/ci.yml`);
nothing is compiled on the deploy machine.

## 1. Edit

Rust in `zw-*/`, `src/`, `crates/`. Frontend JS lives in
`crates/ch-web-ui/assets/js/chat/` as modules — only if you touched those,
rebundle first so the committed `app.js` stays fresh:

```bash
cd crates/ch-web-ui/assets/js/chat
bun build.mjs
```

`build.mjs` wraps `Bun.build` (same entry + externals) so the StyleX esbuild
adapter can run — the CLI `bun build` accepts no plugins. Externals are
`marked`, `highlight.js`, `katex`, `mermaid`, `pdfjs-dist`, `docx-preview`
(resolved in the browser via the import map in `layout.rs`; the rest are
vendored dist files under `assets/js/chat/`).

(CI re-runs this step anyway before `cargo build`, since the binary embeds
`app.js` at compile time via `layout.rs` `asset!(…)`.)

## 2. Push — CI triggers

```bash
git add -A && git commit -m "..." && git push origin main
```

CI (`ci` workflow) runs: bun bundle → `cargo build -p zw --release` →
`topcoat asset bundle` → publishes the binary (`zw`) and the bundle
(`zw-assets.zip`) to the rolling prerelease tag **`ci-latest`**. ~10 min.
Watch: `gh run list --repo Pilser/zerowrapper-mono`.

> Why a release and not `actions/upload-artifact`: the free-tier Actions
> artifact storage cap is 500 MB and each run uploads ~21 MB, so artifact
> uploads eventually fail with `storage quota has been hit`. Release assets
> don't count against that quota; the tag is clobbered on every run.

## 3. Download binary + bundle (must stay paired)

The bundle's manifest IDs belong to that exact binary — never mix a new
binary with an old bundle (web task panics with `failed to resolve asset`).

```bash
rm -rf /tmp/zw-new && mkdir -p /tmp/zw-new
gh release download ci-latest --repo Pilser/zerowrapper-mono -p zw -D /tmp/zw-new
gh release download ci-latest --repo Pilser/zerowrapper-mono -p zw-assets.zip -D /tmp/zw-new
cd /tmp/zw-new && unzip -q zw-assets.zip -d zw-assets
# → /tmp/zw-new/zw  +  /tmp/zw-new/zw-assets/
```

## 4. Copy into the deploy dir (atomic for the binary)

```bash
D=/home/vox/.AAAPROJECTS/FPE/AI-plan/deployment/zerowrapper-mono
cp /tmp/zw-new/zw $D/zw.new && mv -f $D/zw.new $D/zw && chmod +x $D/zw
rm -rf $D/assets && cp -r /tmp/zw-new/zw-assets $D/assets
```

## 5. Restart and verify

Kill the old `./zw`, then run per `deployment/zerowrapper-mono/RUN.md`
(`source mono.env`, `./zw`). Verify:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9092/   # 200
curl -s http://localhost:9092/ | grep -o 'app-[a-z0-9]*\.js'      # current hash
```

Assets serve under `/_topcoat/assets/`. To confirm new frontend is live:

```bash
curl -s http://localhost:9092/_topcoat/assets/<app-hash>.js | grep '<your-symbol>'
```

## Troubleshooting

- **Web task panics `failed to resolve asset`**: binary/bundle mismatch — redo step 3–4 together.
- **`daemon socket LOST` in wrapper log / browser banner**: daemon down — restart it per `RUN.md`; wrapper recovers alone (retries + watchdog, no restart).
- **Prompt fails `-32603`**: upstream provider error, not socket — check provider keys/status (see test-agent `ENV-SETUP.md` §3).
