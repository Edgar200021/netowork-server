use std::sync::Arc;

use axum::{routing::post, Router};

use crate::{
    handlers::{sign_in, sign_up},
    startup::AppState,
};

pub fn configure_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/sign-in", post(sign_in))
        .route("/sign-up", post(sign_up))
}
