mod health_check;
use std::sync::Arc;

use axum::{routing::get, Router};

use crate::app::AppState;

pub use health_check::*;

pub fn configure_routes() -> Router<Arc<AppState>> {
    Router::new().nest(
        "/api",
        Router::new().route("/health_check", get(health_check)),
    )
}
