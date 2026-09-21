use async_trait::async_trait;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use zw_core::{McpToolProvider, ToolOutput};

pub struct ShowFileProvider {
    db: zw_db::DbPool,
    // Whiteboard handle not needed, but we need to emit WS update;
    // we will use a broadcast channel via handler's file_viewer state.
}

impl ShowFileProvider {
    pub fn new(db: zw_db::DbPool) -> Self {
        Self { db }
    }

    fn resolve_path(&self, raw: &str) -> PathBuf {
        let p = Path::new(raw.trim());
        if p.is_absolute() {
            return p.to_path_buf();
        }
        // Resolve relative against ZW_WORKDIR (like whiteboard does)
        let base = std::env::var("ZW_WORKDIR")
            .or_else(|_| std::env::var("ZW_WORKSPACE"))
            .unwrap_or_else(|_| ".".to_string());
        let base = Path::new(&base);
        // Handle ./file.xlsx
        let rel = raw.trim_start_matches("./");
        base.join(rel)
    }
}

#[async_trait]
impl McpToolProvider for ShowFileProvider {
    fn name(&self) -> &str {
        "show_file"
    }

    fn description(&self) -> &str {
        "Show file to user in frontend in viewer to directly see file in workspace and its changes in real time."
    }

    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "required": ["path"],
            "properties": {
                "path": { "type": "string", "description": "File path: ./file.xlsx (workspace) or /abs/path" },
                "action": { "type": "string", "enum": ["open", "close", "list"], "description": "open (default), close, list" }
            }
        })
    }

    async fn call(&self, args: Value) -> anyhow::Result<ToolOutput> {
        let path = args.get("path").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let action = args.get("action").and_then(|v| v.as_str()).unwrap_or("open");

        if action == "list" {
            let files = self.db.open_files_list("shared").await.unwrap_or_default();
            if files.is_empty() {
                return Ok(ToolOutput::new("No files currently shown".to_string()));
            }
            let list = files.iter().map(|f| f.original_path.clone()).collect::<Vec<_>>().join(", ");
            return Ok(ToolOutput::new(format!("Shown files ({}): {}", files.len(), list)));
        }

        if path.is_empty() {
            anyhow::bail!("show_file: `path` is required");
        }

        let abs = self.resolve_path(&path);
        let abs_str = abs.to_string_lossy().to_string();

        // Validate exists
        if !abs.exists() {
            anyhow::bail!("show_file: file not found: {} (resolved: {})", path, abs_str);
        }
        if !abs.is_file() {
            anyhow::bail!("show_file: not a file: {}", abs_str);
        }

        if action == "close" {
            if let Ok(Some(id)) = self.db.file_view_resolve_by_path(&abs_str).await {
                let _ = self.db.open_file_remove("shared", &id).await;
                crate::show_file::emit_update(&self.db, "shared").await;
                return Ok(ToolOutput::new(format!("File closed: {}", path)));
            }
            return Ok(ToolOutput::new(format!("File not shown: {}", path)));
        }

        // open
        let id = self.db.file_view_get_or_create(&abs_str).await?;
        self.db.open_file_add("shared", &id).await?;
        crate::show_file::emit_update(&self.db, "shared").await;
        Ok(ToolOutput::new(format!("File shown: {}", abs_str)))
    }
}

// Helper to emit WS update (called after open/close)
pub async fn emit_update(db: &zw_db::DbPool, session_id: &str) {
    // This will be handled by ws handler's file_viewer state; for now no-op
    // The handler polls open_files_list on demand, but we also broadcast
    let _ = db;
    let _ = session_id;
}
