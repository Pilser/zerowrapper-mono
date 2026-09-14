/// Stub for the future `zerostack` ACP integration.
///
// NOTE: `zerostack` is a binary-only crate (no `src/lib.rs`), so it cannot be
// `use`d as a library — cargo reports "ignoring invalid dependency ... missing
// a lib target" and any `pub use ::zerostack::...` fails with E0433.
// The git dependency in Cargo.toml is kept so CI still fetches and pins the
// repo; actual integration will drive the `zerostack` binary via ACP over
// stdio (subprocess), or via a fork that adds a `lib` target.
pub fn backend() -> &'static str {
    "zerostack-acp-subprocess"
}