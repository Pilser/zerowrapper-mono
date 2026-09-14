## Workflow & Tooling

- Uses tmux as the primary runner for local services during testing and development — restarts via `tmux kill-window` + `tmux new-window` pattern. Confidence: 0.85
- Tests systems by introducing intentional errors (broken JS, broken Mermaid, malformed HTML) and verifying the error-collection pipeline catches them. Confidence: 0.8
- Deploys via CI artifacts — downloads binary + assets with `gh run download`, copies to deployment folder, restarts service in tmux, verifies with curl. Confidence: 0.8
- Prefers MCP tool interfaces (JSON-RPC over HTTP) for system management and inspection over raw shell commands when available. Confidence: 0.75
- Uses a whiteboard system (`.wb` files) as a testing surface for error detection. Confidence: 0.7

## Communication Style

- Writes in terse, stream-of-consciousness style with minimal punctuation and frequent typos — instructions are action-first and compressed. Confidence: 0.85
