/// Minimal wrapper that re‑exports the `Engine` type from `zerostack`.
/// Anything you add later (e.g. custom `dispatch` helpers, wiring to the
/// existing `zw` CLI, etc.) can live right here.
pub mod engine {
    /// Public‑facing engine – you can call `Engine::default().dispatch(prompt).await`
    /// from anywhere in the `zw` binary.
    pub use ::zerostack::engine::Engine;
}