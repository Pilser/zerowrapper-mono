//! Session-bound `ask_user` tool: rich multi-question prompts answered by the
//! human through the drawer (REST), never the terminal or the live socket.
//!
//! The built-in permission-Ask stays dead (YOLO policy: `permission=None`,
//! hardcoded in `new_engine`). This is a separate, deliberate question flow:
//! the model asks, the turn waits server-side, the human answers late —
//! disconnects and restarts in between are fine.
//!
//! Wiring: one provider instance per engine (holds its `session_id`), driven
//! through `Engine::with_extra_tools`. Instant drawer-open travels on a
//! per-turn notifier into the turn's event stream; correctness never depends
//! on it — the drawer also polls `GET /api/ask/pending`.

use std::collections::HashMap;
use std::sync::{Arc, LazyLock, Mutex};

use tokio::sync::{broadcast, mpsc};
use zw_core::{McpToolProvider, ToolOutput};

/// Hardcoded policy: how long a turn waits for answers before continuing
/// with everything marked unanswered. Not env-configurable by design.
pub const ASK_TIMEOUT_SECS: u64 = 1800;
/// Hardcoded policy: upper bound per call so one turn can't spam the drawer.
pub const ASK_MAX_QUESTIONS: usize = 8;

/// Answers fanned out by the REST endpoint: (ask_id, answers JSON).
static ASK_ANSWERS: LazyLock<broadcast::Sender<(String, serde_json::Value)>> =
    LazyLock::new(|| broadcast::channel::<(String, serde_json::Value)>(64).0);

/// Called by `POST /api/ask/answer` after persisting: wakes the tool call
/// waiting on this ask id (or nobody, if the turn already timed out).
pub fn publish_answer(ask_id: &str, answers: serde_json::Value) {
    let _ = ASK_ANSWERS.send((ask_id.to_string(), answers));
}

/// Instant-open payload: AskRequest events for the turn's stream.
#[derive(Debug, Clone)]
pub struct AskEvent {
    pub ask_id: String,
    pub session_id: String,
    pub questions: serde_json::Value,
}

/// Per-turn notifier sink, armed by `run_embedded` for the running turn.
/// Keyed by session because provider instances outlive turns.
static ASK_BUSSES: LazyLock<Mutex<HashMap<String, AskNotifyBus>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

/// Notifier arm for one turn: the provider pushes here, the turn's mapper
/// task forwards into the event stream as `StreamEvent::AskRequest`.
#[derive(Clone, Default)]
pub struct AskNotifyBus {
    tx: Arc<Mutex<Option<mpsc::Sender<AskEvent>>>>,
}

pub(crate) fn register_bus(session_id: &str, bus: AskNotifyBus) {
    if let Ok(mut m) = ASK_BUSSES.lock() {
        m.insert(session_id.to_string(), bus);
    }
}

pub(crate) fn bus_for(session_id: &str) -> Option<AskNotifyBus> {
    ASK_BUSSES.lock().ok()?.get(session_id).cloned()
}

impl AskNotifyBus {
    pub(crate) fn arm(&self, tx: mpsc::Sender<AskEvent>) {
        if let Ok(mut guard) = self.tx.lock() {
            *guard = Some(tx);
        }
    }

    pub(crate) fn disarm(&self) {
        if let Ok(mut guard) = self.tx.lock() {
            *guard = None;
        }
    }
}

fn nanos_id(prefix: &str) -> String {
    let n = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("{prefix}-{n:x}")
}

/// Session-bound question tool. Constructed per engine in `new_engine`
/// (which knows the sid); turns arm its notifier per run.
pub struct AskUserProvider {
    session_id: String,
    db: zw_db::DbPool,
    bus: AskNotifyBus,
}

impl AskUserProvider {
    pub fn new(session_id: &str, db: zw_db::DbPool) -> Self {
        let bus = AskNotifyBus::default();
        register_bus(session_id, bus.clone());
        Self {
            session_id: session_id.to_string(),
            db,
            bus,
        }
    }

    pub fn bus(&self) -> AskNotifyBus {
        self.bus.clone()
    }
}

fn question_text(q: &serde_json::Value, fallback_id: &str) -> (String, String, String, Vec<String>) {
    let id = q
        .get("id")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or(fallback_id)
        .to_string();
    let question = q.get("question").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let objective = q.get("objective").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let options = q
        .get("options")
        .and_then(|v| v.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .take(12)
                .collect()
        })
        .unwrap_or_default();
    (id, question, objective, options)
}

#[async_trait::async_trait]
impl McpToolProvider for AskUserProvider {
    fn name(&self) -> &str {
        "ask_user"
    }

    fn description(&self) -> &str {
        "Ask the human one or more questions and wait for answers. Use when a \
         decision, preference, or missing fact blocks progress. Pass 1-8 \
         questions; each SHOULD carry an `objective` (why you need it) so the \
         human can answer well, and MAY carry `options` (suggested picks — \
         the human can always type their own). The human may also edit your \
         question text and add their own questions before submitting. You \
         receive every answer back as text and continue the turn."
    }

    fn input_schema(&self) -> serde_json::Value {
        serde_json::json!({
            "type": "object",
            "required": ["questions"],
            "properties": {
                "questions": {
                    "type": "array",
                    "minItems": 1,
                    "maxItems": ASK_MAX_QUESTIONS,
                    "items": {
                        "type": "object",
                        "required": ["question"],
                        "properties": {
                            "id": { "type": "string" },
                            "question": { "type": "string" },
                            "objective": { "type": "string" },
                            "options": { "type": "array", "items": { "type": "string" } }
                        }
                    }
                }
            }
        })
    }

    async fn call(&self, args: serde_json::Value) -> anyhow::Result<ToolOutput> {
        let raw = args
            .get("questions")
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default();
        if raw.is_empty() {
            anyhow::bail!("ask_user: `questions` must be a non-empty array");
        }
        // Normalize (cap count, default ids) — the normalized form is what
        // the drawer renders and what comes back answered.
        let mut questions = Vec::new();
        for (i, q) in raw.iter().take(ASK_MAX_QUESTIONS).enumerate() {
            let (id, question, objective, options) =
                question_text(q, &format!("q{}", i + 1));
            if question.trim().is_empty() {
                continue;
            }
            questions.push(serde_json::json!({
                "id": id, "question": question,
                "objective": objective, "options": options,
            }));
        }
        if questions.is_empty() {
            anyhow::bail!("ask_user: every question was empty");
        }

        let ask_id = nanos_id("ask");
        let questions_json = serde_json::json!(questions).to_string();
        self.db
            .ask_insert(&ask_id, &self.session_id, &questions_json)
            .await?;

        // Best-effort instant drawer-open (correctness never depends on it:
        // the drawer polls pending too).
        if let Ok(guard) = self.bus.tx.lock() {
            if let Some(tx) = guard.as_ref() {
                let _ = tx
                    .try_send(AskEvent {
                        ask_id: ask_id.clone(),
                        session_id: self.session_id.clone(),
                        questions: serde_json::json!(questions),
                    })
                    .ok();
            }
        }

        // Wait for the REST answer (or timeout — the turn continues either way).
        let mut rx = ASK_ANSWERS.subscribe();
        let answers: Option<serde_json::Value> = {
            let fut = async {
                loop {
                    match rx.recv().await {
                        Ok((id, ans)) if id == ask_id => break Some(ans),
                        Ok(_) => continue,
                        Err(broadcast::error::RecvError::Lagged(_)) => continue,
                        Err(_) => break None,
                    }
                }
            };
            match tokio::time::timeout(std::time::Duration::from_secs(ASK_TIMEOUT_SECS), fut).await
            {
                Ok(v) => v,
                Err(_) => None,
            }
        };

        let (text, status_note) = match answers {
            Some(ans) => {
                let _ = self.db.ask_answer(&ask_id, &ans.to_string()).await;
                (format_answers(&questions, &ans), None)
            }
            None => {
                let _ = self.db.ask_expire(&ask_id).await;
                (
                    format_answers(
                        &questions,
                        &serde_json::json!({}),
                    ),
                    Some("(answering timed out after 30 min — continuing with what we have)"),
                )
            }
        };
        let mut out = String::from("User answers:\n");
        if let Some(note) = status_note {
            out.push_str(note);
            out.push('\n');
        }
        out.push_str(&text);
        Ok(ToolOutput::new(out))
    }
}

/// Render answers back to the model, keyed by question id. User-added
/// questions (`custom-N`) and edits come through the same shape.
fn format_answers(questions: &[serde_json::Value], answers: &serde_json::Value) -> String {
    // Entries are {id, answer} plus the (possibly user-edited) `question`
    // text, so the model sees what was actually answered.
    let by_id: std::collections::HashMap<String, (String, String)> = answers
        .get("answers")
        .and_then(|v| v.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|e| {
                    let id = e.get("id")?.as_str()?.to_string();
                    let ans = e.get("answer")?.as_str().unwrap_or("").to_string();
                    let q = e.get("question").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    Some((id, (q, ans)))
                })
                .collect()
        })
        .unwrap_or_default();
    // Bare `{ id: answer }` map shape is also accepted from REST clients.
    let flat: std::collections::HashMap<String, String> = answers
        .as_object()
        .map(|o| {
            o.iter()
                .filter_map(|(k, v)| {
                    if k == "answers" {
                        None
                    } else {
                        Some((k.clone(), v.as_str().unwrap_or("").to_string()))
                    }
                })
                .collect()
        })
        .unwrap_or_default();
    // Unified (id, shown-question, answer): entry text wins when the human
    // edited the question, flat `{id: answer}` map as fallback.
    let mut rows: Vec<(String, String, String)> = Vec::new();
    for q in questions {
        let (id, question, objective, _) = question_text(q, "?");
        let entry = by_id.get(&id);
        let shown_q = entry
            .map(|(eq, _)| eq.clone())
            .filter(|s| !s.trim().is_empty())
            .unwrap_or(question);
        let mut ans = entry.map(|(_, a)| a.clone()).unwrap_or_default();
        if ans.is_empty() {
            ans = flat.get(&id).cloned().unwrap_or_default();
        }
        let why = objective
            .trim()
            .is_empty()
            .then(String::new)
            .unwrap_or_else(|| format!(" (why: {})", objective.trim()));
        rows.push((id, format!("{shown_q}{why}"), ans));
    }
    // Answers to user-added questions not in the original set (keeps the
    // human-written question text when present).
    for (id, (eq, ans)) in by_id.iter() {
        let known = questions.iter().any(|q| {
            q.get("id").and_then(|v| v.as_str()).unwrap_or("") == id.as_str()
        });
        if !known && !ans.trim().is_empty() {
            let label = if eq.trim().is_empty() {
                "(user-added)".to_string()
            } else {
                eq.clone()
            };
            rows.push((id.clone(), label, ans.clone()));
        }
    }
    for (id, ans) in flat.iter() {
        let known = questions.iter().any(|q| {
            q.get("id").and_then(|v| v.as_str()).unwrap_or("") == id.as_str()
        }) || rows.iter().any(|(rid, _, _)| rid == id);
        if !known && !ans.trim().is_empty() {
            rows.push((id.clone(), "(user-added)".to_string(), ans.clone()));
        }
    }
    let mut lines = Vec::new();
    let mut unanswered = Vec::new();
    for (id, shown_q, ans) in &rows {
        if ans.trim().is_empty() {
            unanswered.push(id.clone());
        }
        lines.push(format!("- [{id}] {shown_q}: {ans}"));
    }
    let mut s = lines.join("\n");
    if !unanswered.is_empty() {
        s.push_str(&format!("\nUnanswered: {}", unanswered.join(", ")));
    }
    s
}
