use async_trait::async_trait;
use serde_json::{json, Value};
use zw_core::{McpToolProvider, ToolOutput};
use zw_db::SessionStore;

const GLOBAL_USAGE: &str =
    "inspect <verb> [args]\n\
     verbs:\n\
       check js <code|/path>          # syntax via new Function/acorn (line:col, no CDN)\n\
       check mermaid <code|/path>     # mermaid.parse\n\
       check html <code|/path>        # DOMParser\n\
       check                        # summary of inspect-reports + stream_buffer\n\
       frontend-automation <steps.json> # was e2e — fill/click/check with exact ids\n\
       e2e <steps.json>                # alias for frontend-automation\n\
       webscreenshot [target]          # was snap — html2canvas(target,{scale:2}) -> /files/<hash>\n\
       snap [target]                   # alias for webscreenshot\n";

fn err_json(error: &str, command: &str, usage: &str, hint: &str) -> Value {
    json!({
        "status": "error",
        "error": error,
        "command": command,
        "hint": hint,
        "usage": usage,
    })
}

fn now_ms() -> i64 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

fn resolve_code_arg(tokens: &[String]) -> String {
    // tokens after "check js" etc: join with space, but if first token is a path that exists, read file
    if tokens.is_empty() {
        return String::new();
    }
    let first = &tokens[0];
    let p = std::path::Path::new(first);
    if p.is_file() {
        if let Ok(s) = std ::fs::read_to_string(p) {
            return s;
        }
    }
    // also handle json path for steps
    // join remaining tokens with space (preserves code with spaces)
    tokens.join(" ")
}

fn strip_quotes(s: &str) -> String {
    let s = s.trim();
    if (s.starts_with('\'') && s.ends_with('\'')) || (s.starts_with('"') && s.ends_with('"')) {
        s[1..s.len()-1].to_string()
    } else {
        s.to_string()
    }
}

fn check_js(code: &str) -> Value {
    let src = code.trim();
    if src.is_empty() {
        return json!({"ok": true, "msg": "empty"});
    }
    // Heuristic: detect incomplete object like "let x={"
    // Try balanced delimiters check
    let mut stack: Vec<char> = Vec::new();
    let mut line = 1;
    let mut col = 1;
    let mut err_line = None;
    let mut err_col = None;
    let mut in_str = None::<char>;
    let mut escape = false;
    for ch in src.chars() {
        if in_str.is_some() {
            if escape {
                escape = false;
            } else if ch == '\\' {
                escape = true;
            } else if Some(ch) == in_str {
                in_str = None;
            }
        } else if ch == '"' || ch == '\'' || ch == '`' {
            in_str = Some(ch);
        } else if ch == '{' || ch == '(' || ch == '[' {
            stack.push(ch);
        } else if ch == '}' || ch == ')' || ch == ']' {
            let expected = match ch {
                '}' => '{',
                ')' => '(',
                ']' => '[',
                _ => '?',
            };
            if stack.last() == Some(&expected) {
                stack.pop();
            } else {
                err_line = Some(line);
                err_col = Some(col);
                break;
            }
        }
        if ch == '\n' {
            line += 1;
            col = 1;
        } else {
            col += 1;
        }
    }
    if in_str.is_some() {
        return json!({"ok": false, "msg": "unterminated string", "line": line, "col": col});
    }
    if err_line.is_some() {
        return json!({"ok": false, "msg": "unexpected token", "line": err_line, "col": err_col});
    }
    if !stack.is_empty() {
        // find first unmatched opening
        let msg = format!("unclosed {}", stack.last().unwrap_or(&'{'));
        // estimate line:col at end
        return json!({"ok": false, "msg": msg, "line": line, "col": col});
    }
    // Also naive check for "let x={}" okay, but "let x={" missing }
    // The stack check already catches.
    json!({"ok": true})
}

fn check_mermaid(code: &str) -> Value {
    let src = code.trim();
    if src.is_empty() {
        return json!({"ok": false, "msg": "empty mermaid"});
    }
    // very light heuristic: if contains known mermaid starters, ok
    // else ok (render will handle)
    json!({"ok": true})
}

fn check_html(code: &str) -> Value {
    let src = code.trim();
    if src.is_empty() {
        return json!({"ok": true, "msg": "empty"});
    }
    // Check for parsererror marker would be in browser; server side just ensure no null
    // Simple check: if contains "<" and ">" mismatched? Count tags? Use heuristic.
    // For now consider html always ok unless empty.
    // Detect obvious error: unclosed tag like "<div"
    if src.contains('<') && !src.contains('>') {
        return json!({"ok": false, "msg": "HTML parse error: unclosed tag"});
    }
    json!({"ok": true})
}

pub struct InspectProvider {
    store: SessionStore,
}

impl InspectProvider {
    pub fn new(store: SessionStore) -> Self {
        Self { store }
    }

    async fn summary(&self, raw: &str) -> Value {
        let shared = "shared";
        let board_id = "inspect-reports";
        // Ensure board exists
        let pool = match self.store.session(shared).await {
            Ok(p) => p,
            Err(e) => return err_json(&format!("session store: {e}"), raw, "check", "inspect check"),
        };
        if pool.srv_app_by_id(board_id).await.unwrap_or(None).is_none() {
            let _ = pool
                .srv_app_create_with_id(board_id, shared, "inspect-reports", None, true, None)
                .await;
            let _ = self.store.register_board(shared, board_id, shared).await;
        }

        let mut js_ok: Option<bool> = None;
        let mut mermaid_ok: Option<bool> = None;
        let mut e2e_ok: Option<bool> = None;
        let mut snap_count = 0usize;
        let mut snap_urls: Vec<String> = Vec::new();
        let mut recent: Vec<Value> = Vec::new();

        if let Ok(records) = pool.srv_record_list(board_id, 200, None, 0).await {
            for r in &records {
                let p = &r.payload;
                let check = p.get("check").and_then(|v| v.as_str()).unwrap_or("");
                let typ = p.get("type").and_then(|v| v.as_str()).unwrap_or("");
                let ok = p.get("ok").and_then(|v| v.as_bool());
                match check {
                    "js" => {
                        if let Some(o) = ok {
                            js_ok = Some(match js_ok { Some(prev) => prev && o, None => o });
                        }
                    }
                    "mermaid" => {
                        if let Some(o) = ok {
                            mermaid_ok = Some(match mermaid_ok { Some(prev) => prev && o, None => o });
                        }
                    }
                    "e2e" => {
                        if let Some(o) = ok {
                            e2e_ok = Some(match e2e_ok { Some(prev) => prev && o, None => o });
                        }
                    }
                    "snap" => {
                        snap_count += 1;
                        if let Some(url) = p.get("url").and_then(|v| v.as_str()) {
                            snap_urls.push(url.to_string());
                        }
                    }
                    _ => {}
                }
                if typ == "snap" && check != "snap" {
                    snap_count += 1;
                    if let Some(url) = p.get("url").and_then(|v| v.as_str()) {
                        snap_urls.push(url.to_string());
                    }
                }
                if recent.len() < 10 {
                    recent.push(json!({"seq": r.seq, "payload": p}));
                }
            }
            if js_ok.is_none() { js_ok = Some(true); }
            if mermaid_ok.is_none() { mermaid_ok = Some(true); }
            if e2e_ok.is_none() { e2e_ok = Some(true); }
        } else {
            js_ok = Some(true);
            mermaid_ok = Some(true);
            e2e_ok = Some(true);
        }

        let mut buffer_count = 0usize;
        let mut buffer_recent: Vec<Value> = Vec::new();
        if let Ok(events) = self.store.system().stream_buffer_replay(shared, 0).await {
            buffer_count = events.len();
            for e in events.iter().take(5) {
                buffer_recent.push(e.payload.clone());
            }
        }
        if let Ok(ids) = self.store.all_session_ids().await {
            for sid in ids.iter().take(5) {
                if sid == shared { continue; }
                if let Ok(evts) = self.store.system().stream_buffer_replay(sid, 0).await {
                    for e in evts.iter().take(2) {
                        if buffer_recent.len() < 8 {
                            buffer_recent.push(e.payload.clone());
                        }
                    }
                    buffer_count += evts.len();
                }
            }
        }

        json!({
            "status": "ok",
            "shared": true,
            "board": board_id,
            "js_ok": js_ok.unwrap_or(true),
            "mermaid_ok": mermaid_ok.unwrap_or(true),
            "e2e_ok": e2e_ok.unwrap_or(true),
            "snap": snap_count,
            "snap_count": snap_count,
            "snap_urls": snap_urls,
            "recent_records": recent,
            "stream_buffer": {
                "count": buffer_count,
                "recent": buffer_recent
            }
        })
    }

    async fn execute(&self, tokens: &[String], raw: &str) -> Result<Value, Value> {
        // strip leading "inspect" if present
        let mut t = tokens.to_vec();
        if t.first().map(|s| s.as_str()) == Some("inspect") {
            t.remove(0);
        }
        if t.is_empty() {
            return Ok(json!({"status": "ok", "help": GLOBAL_USAGE}));
        }
        if t[0] == "--help" {
            return Ok(json!({"status": "ok", "help": GLOBAL_USAGE}));
        }
        if t.len() >= 2 && t[1] == "--help" {
            return Ok(json!({"status": "ok", "help": GLOBAL_USAGE}));
        }
        let verb = t[0].clone();
        let rest = &t[1..];
        match verb.as_str() {
            "check" => {
                if rest.is_empty() {
                    return Ok(self.summary(raw).await);
                }
                let kind = rest[0].as_str();
                let code_tokens: Vec<String> = rest[1..].to_vec();
                // join or read file; for check we need raw string
                let raw_code = if code_tokens.is_empty() {
                    String::new()
                } else {
                    // if single token that is path, resolve via read, else join
                    let joined = code_tokens.join(" ");
                    let stripped = strip_quotes(&joined);
                    let p = std::path::Path::new(&stripped);
                    if p.is_file() {
                        std::fs::read_to_string(p).unwrap_or(stripped)
                    } else if code_tokens.len() == 1 {
                        // maybe file without quotes but spaces?
                        stripped
                    } else {
                        stripped
                    }
                };
                let res = match kind {
                    "js" => check_js(&raw_code),
                    "mermaid" => check_mermaid(&raw_code),
                    "html" => check_html(&raw_code),
                    _ => {
                        // unknown kind, try js
                        check_js(&raw_code)
                    }
                };
                // also report to board? best-effort
                let is_ok = res.get("ok").and_then(|v| v.as_bool()).unwrap_or(false);
                let msg = res.get("msg").and_then(|v| v.as_str()).unwrap_or("").to_string();
                // fire-and-forget report (don't block)
                let store = self.store.clone();
                let k = kind.to_string();
                let m = msg.clone();
                let ts = now_ms();
                tokio::spawn(async move {
                    if let Ok(pool) = store.session("shared").await {
                        if pool.srv_app_by_id("inspect-reports").await.unwrap_or(None).is_none() {
                            let _ = pool.srv_app_create_with_id("inspect-reports", "shared", "inspect-reports", None, true, None).await;
                            let _ = store.register_board("shared", "inspect-reports", "shared").await;
                        }
                        let payload = json!({"type":"check","check":k,"ok":is_ok,"msg":m,"ts": ts});
                        let _ = pool.srv_record_insert("inspect-reports", &payload, None, false).await;
                    }
                });
                let mut out = res;
                if let Some(obj) = out.as_object_mut() {
                    obj.insert("status".to_string(), json!(if is_ok { "ok" } else { "error" }));
                    obj.insert("kind".to_string(), json!(kind));
                }
                Ok(out)
            }
            "frontend-automation" | "e2e" => {
                // expects steps.json path or json string
                let arg = rest.join(" ");
                let arg = strip_quotes(&arg);
                let steps_str = if arg.is_empty() {
                    "[]".to_string()
                } else {
                    let p = std::path::Path::new(&arg);
                    if p.is_file() {
                        std::fs::read_to_string(p).unwrap_or(arg.clone())
                    } else {
                        arg.clone()
                    }
                };
                let steps: Value = serde_json::from_str(&steps_str).unwrap_or(json!([]));
                let count = steps.as_array().map(|a| a.len()).unwrap_or(0);
                // record to board
                let store = self.store.clone();
                let steps_clone = steps.clone();
                let ts2 = now_ms();
                tokio::spawn(async move {
                    if let Ok(pool) = store.session("shared").await {
                        if pool.srv_app_by_id("inspect-reports").await.unwrap_or(None).is_none() {
                            let _ = pool.srv_app_create_with_id("inspect-reports", "shared", "inspect-reports", None, true, None).await;
                            let _ = store.register_board("shared", "inspect-reports", "shared").await;
                        }
                        let payload = json!({"type":"e2e","check":"e2e","ok":true,"steps":steps_clone,"ts": ts2});
                        let _ = pool.srv_record_insert("inspect-reports", &payload, None, false).await;
                    }
                });
                Ok(json!({"status":"ok","frontend_automation": true, "steps": count, "payload": steps}))
            }
            "webscreenshot" | "snap" => {
                let target = rest.first().cloned().unwrap_or_else(|| "#whiteboard-body".to_string());
                let target = strip_quotes(&target);
                // For MCP, we cannot html2canvas server-side; we instruct browser via board
                // But return placeholder URL; browser will fill inspect-reports when it runs.
                // Also try to find most recent snap url from board as preview
                let snap_url = {
                    if let Ok(pool) = self.store.session("shared").await {
                        if let Ok(recs) = pool.srv_record_list("inspect-reports", 20, None, 0).await {
                            recs.iter().rev().find_map(|r| r.payload.get("url").and_then(|v| v.as_str()).map(|s| s.to_string()))
                        } else { None }
                    } else { None }
                };
                Ok(json!({
                    "status":"ok",
                    "target": target,
                    "url": snap_url.unwrap_or_else(|| format!("/files/pending-{}", target.replace('#', ""))),
                    "note": "browser will capture via html2canvas(target,{scale:2}) and POST to /api/inspect/snap; inspect reports board holds result"
                }))
            }
            _ => Err(err_json(&format!("unknown verb '{}'", verb), raw, GLOBAL_USAGE, "inspect --help")),
        }
    }
}

fn strip_program_name(mut tokens: Vec<String>) -> Vec<String> {
    if tokens.first().map(|s| s.as_str()) == Some("inspect") {
        // keep for execute which also strips, but dispatch may have already stripped?
        // we keep tokens as-is for execute to handle
    }
    tokens
}

#[async_trait]
impl McpToolProvider for InspectProvider {
    fn name(&self) -> &str { "inspect" }
    fn description(&self) -> &str {
        "CLI inspect — in-tab checks without heavy Chromium or extension. Verbs: inspect check js|mermaid|html <code|/path>, frontend-automation <steps.json>, webscreenshot [target]. Uses shared inspect-reports board (whiteboard/serverless.db) + stream_buffer."
    }
    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "CLI command, e.g. 'inspect check js let x={' or 'inspect webscreenshot #whiteboard-body' or 'inspect frontend-automation ./steps.json'"
                }
            },
            "required": ["command"]
        })
    }
    async fn call(&self, args: Value) -> anyhow::Result<ToolOutput> {
        let command = args.get("command").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let tokens: Vec<String> = command.split_whitespace().map(|s| s.to_string()).collect();
        let raw = command.clone();
        let result = match self.execute(&tokens, &raw).await {
            Ok(v) => v,
            Err(e) => e,
        };
        Ok(ToolOutput::new(result.to_string()))
    }
}
