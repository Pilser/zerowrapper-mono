// LOCAL ONLY — ci.yml still uses the `bun build app-entry.js ...` one-liner.
// Mirrors that one-liner (same entry + externals) via Bun.build() so the
// StyleX esbuild adapter can run (CLI `bun build` accepts no plugins).
import stylex from '@stylexjs/unplugin';

const result = await Bun.build({
  entrypoints: ['./app-entry.js'],
  outdir: '.',
  naming: { entry: 'app.js' },
  format: 'esm',
  target: 'browser',
  external: ['marked', 'highlight.js', 'katex', 'mermaid', 'pdfjs-dist', 'docx-preview'],
  metafile: true,
  plugins: [stylex.esbuild({ useCSSLayers: true })],
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}

console.log('outputs:', result.outputs.map((o) => o.path));
