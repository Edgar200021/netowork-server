use std::sync::Arc;

use axum::{routing::post, Router};

use crate::{
    app::AppState,
    handlers::{sign_in, sign_up},
};

pub fn configure_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/auth/sign-up", post(sign_up))
        .route("/auth/sign-in", post(sign_in))
}
