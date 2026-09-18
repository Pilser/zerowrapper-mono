use serde_json::json;

async fn tmp_pool() -> (zw_db::DbPool, std::path::PathBuf) {
    let dir = std::env::temp_dir().join(format!(
        "zwdb_bugs_{}_{}",
        std::process::id(),
        std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    let path = dir.join("test.db");
    let pool = zw_db::DbPool::open(path.to_str().unwrap()).await.unwrap();
    pool.migrate().await.unwrap();
    pool.migrate_session().await.unwrap();
    (pool, dir)
}

#[tokio::test]
async fn bug2_mat_publish_after_create_then_remove_does_not_crash() {
    let dir = std::env::temp_dir().join(format!(
        "zwmat_pub2_{}_{}",
        std::process::id(),
        std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    let db_path = dir.join("system.db");
    let system = zw_db::DbPool::open(db_path.to_str().unwrap()).await.unwrap();
    system.migrate().await.unwrap();
    let store = zw_materials::TemplateStore::new(dir.clone(), system.clone());

    let sid = "web.alpha";
    store.ensure_template("myapp", "My App", "app", "a demo").await.unwrap();
    store.remove("myapp").await.unwrap();

    let board = store
        .sessions()
        .create_board(sid, "My App", None, true, None)
        .await
        .unwrap();
    let pool = store.sessions().session(sid).await.unwrap();
    pool.srv_record_insert(&board, &json!({"name": "record-one"}), None, false).await.unwrap();

    let result = store
        .publish(sid, &board, "myapp", "My App", "app", "a demo", "first")
        .await;
    match result {
        Ok(v) => {
            assert_eq!(v["template_id"], json!("myapp"));
            assert_eq!(v["version"], json!(1));
        }
        Err(e) => panic!("mat publish after create+remove failed: {e}"),
    }

    std::fs::remove_dir_all(&dir).ok();
}

#[tokio::test]
async fn bug1_keys_scope_column_exists() {
    let (pool, dir) = tmp_pool().await;
    let board = pool.srv_app_create("owner", "t", None, true, None).await.unwrap();
    pool.conn().await
        .execute(
            "INSERT OR REPLACE INTO srv_board_index (board_id, session_id, owner_key) VALUES (?1, 'sid1', 'owner')",
            (board.as_str(),),
        )
        .await
        .unwrap();
    let (bucket, _secret) = pool
        .srv_key_issue(&board, "owner", "reader", None, None)
        .await
        .expect("reader key issue should not crash");
    let keys = pool.srv_key_list(&board, "owner").await.unwrap();
    assert_eq!(keys.len(), 1);
    assert_eq!(keys[0].bucket, bucket);
    let (cbucket, _csecret) = pool
        .srv_key_issue(&board, "owner", "customer", None, Some("cust-123"))
        .await
        .expect("customer key with scope should succeed");
    let keys = pool.srv_key_list(&board, "owner").await.unwrap();
    assert_eq!(keys.len(), 2);
    let cust = keys.iter().find(|k| k.role == "customer").unwrap();
    assert_eq!(cust.bucket, cbucket);
    assert_eq!(cust.scope.as_deref(), Some("cust-123"));
    std::fs::remove_dir_all(&dir).ok();
}

#[tokio::test]
async fn bug3_recipe_dollar_set_action_applies() {
    let (pool, dir) = tmp_pool().await;
    let board = pool.srv_app_create("owner", "t", None, true, None).await.unwrap();
    pool.srv_recipe_add(
        &board,
        "on-booking",
        "record.created",
        None,
        true,
        None,
        &json!([{"$set": {"status": "pending"}}]).to_string(),
    )
    .await
    .unwrap();

    let recipe = pool.srv_recipe_list(&board).await.unwrap();
    let recipes: Vec<zw_recipe::Recipe> = recipe.iter().map(|r| {
        zw_recipe::Recipe {
            name: r.name.clone(),
            when: r.when_json.clone(),
            match_json: r.match_json.clone(),
            enabled: r.enabled,
            dedup_on: r.dedup_on.clone(),
            actions: r.actions_json.as_array().cloned().unwrap_or_default(),
        }
    }).collect();

    let seq = pool.srv_record_insert(&board, &json!({"name": "bob"}), Some("test"), true).await.unwrap();
    let ctx = zw_recipe::EventContext::record_created(&board, seq, &json!({"name": "bob"}), None);
    let engine = zw_recipe::Engine { db: &pool };
    let out = engine.run_recipes(&recipes, &zw_recipe::Secrets::new(), &ctx, false).await;
    assert_eq!(out.len(), 1);
    let (name, outcome) = &out[0];
    assert_eq!(name, "on-booking");
    assert!(outcome.matched, "recipe should match record.created");
    assert!(outcome.report.actions_run.iter().any(|a| a.contains("Set")),
        "expected a Set action to run, got: {:?}", outcome.report.actions_run);
    assert!(!outcome.report.logs.iter().any(|l| l.contains("skipping unknown")),
        "expected no unknown-action skip, got logs: {:?}", outcome.report.logs);

    let rec = pool.srv_record_get(&board, 1).await.unwrap().unwrap();
    assert_eq!(rec.payload["status"], json!("pending"),
        "$set with status=pending should persist to the record, got {:?}", rec.payload);

    std::fs::remove_dir_all(&dir).ok();
}

// Regression: the stream cursor used to be per-session MAX(seq)+1, so when the
// TTL sweeper drained the ephemeral buffer, seq rewound to 1 and the frontend
// (`seq <= lastSeq`) silently dropped every live event until a manual refresh.
// The durable stream_seq counter must never rewind across a buffer drain.
#[tokio::test]
async fn stream_seq_is_monotonic_across_buffer_drain() {
    let (pool, dir) = tmp_pool().await;
    let sid = "sess_seq_durable";
    let a = pool.stream_buffer_append(sid, &json!({"type":"chunk","content":"a"})).await.unwrap();
    let b = pool.stream_buffer_append(sid, &json!({"type":"chunk","content":"b"})).await.unwrap();
    assert!(b > a, "seq must increase within a turn: {a} -> {b}");
    // Simulate the TTL sweeper draining the ephemeral replay buffer.
    pool.conn()
        .await
        .execute("DELETE FROM stream_buffer", turso::params::Params::None)
        .await
        .unwrap();
    assert_eq!(pool.stream_buffer_max_seq(sid).await.unwrap(), 0, "buffer should be empty");
    let c = pool.stream_buffer_append(sid, &json!({"type":"chunk","content":"c"})).await.unwrap();
    assert!(c > b, "seq rewound after buffer drain: {b} -> {c}");
    std::fs::remove_dir_all(&dir).ok();
}