use axum::{middleware, routing::get, Router};
use std::sync::Arc;

mod auth;
mod health_check;

use crate::{app::AppState, middlewares::auth};

use health_check::*;

pub fn configure_routes(state: Arc<AppState>) -> Router<Arc<AppState>> {
    Router::new().nest(
        "/api",
        Router::new()
            .route("/health_check", get(health_check))
            .route_layer(middleware::from_fn_with_state(state, auth))
            .merge(auth::configure_routes()),
    )
}
