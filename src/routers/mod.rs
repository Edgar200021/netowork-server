use axum::{routing::get, Router};
use std::sync::Arc;

mod auth;
mod health_check;

use crate::app::AppState;

use health_check::*;

pub fn configure_routes() -> Router<Arc<AppState>> {
    Router::new().nest(
        "/api",
        Router::new()
            .route("/health_check", get(health_check))
            .merge(auth::configure_routes()),
    )
}
