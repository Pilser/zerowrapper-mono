// ESM shim for jszip. jszip only ships a UMD build (jszip.min.js, loaded as a
// classic <script> before the module graph, setting window.JSZip). docx-preview
// does `import JSZip from 'jszip'`, which needs a real ES module — this shim
// re-exports the UMD global under the bare specifier "jszip" (import map in
// layout.rs). Same vendored-dist approach as the other renderer libs.
const JSZip = (typeof globalThis !== 'undefined' && globalThis.JSZip) || undefined;
export default JSZip;
export { JSZip };
