/// In-process `zerostack` engine (Pilser fork, which adds a `lib` target).
///
/// Entry point for direct prompt injection is
/// [`engine::Engine::run_string`]: pass the user text, get a `RunOutput`
/// back — no socket, no subprocess, no ACP hop needed for the embedded mode.
pub mod engine {
    pub use ::zerostack::engine::*;
}