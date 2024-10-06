mod auth;

use std::sync::Arc;

use axum::Router;

use crate::startup::AppState;

pub fn configure_routes() -> Router<Arc<AppState>> {
    Router::new().nest("/auth", auth::configure_routes())
}
