use std::time::Duration;
use tokio::time;
use zw_db::SessionStore;

pub fn spawn_ttl_sweeper(store: SessionStore, every: Duration) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        loop {
            time::sleep(every).await;
            match store.ttl_sweep_all().await {
                Ok(deleted) => {
                    if deleted > 0 {
                        tracing::info!("ttl sweeper: deleted {deleted} expired records");
                    }
                }
                Err(e) => tracing::warn!("ttl sweeper: {e}"),
            }
            // Ephemeral replay buffer: drain 10 min after turn_complete,
            // 60 min for orphaned (server went off). NOT session storage.
            if let Err(e) = store.system().stream_buffer_sweep().await {
                tracing::warn!("stream_buffer sweep: {e}");
            } else {
                // also try memory purge for old sessions (best-effort)
                // memory buffer is bounded to 500 per session already
            }
        }
    })
}