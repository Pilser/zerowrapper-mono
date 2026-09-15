use topcoat::Result;
use topcoat::router::{Response, route};
use topcoat::router::content::websocket::WebSocketUpgrade;
use topcoat::context::{Cx, app_context};

use crate::context::AppContext;
use crate::ws::handler::handle_ws_connection;

#[route(GET "/ws")]
pub async fn ws(cx: &Cx, upgrade: WebSocketUpgrade) -> Result<Response> {
    let ctx: &AppContext = app_context(cx);
    let whiteboard = ctx.whiteboard().cloned();
    let buffer_db = ctx.db.system().clone();

    upgrade.on_upgrade(move |socket| async move {
        handle_ws_connection(socket, whiteboard, buffer_db).await;
    })
}
