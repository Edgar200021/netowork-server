use std::sync::Arc;

use axum::{routing::post, Router};

use crate::{app::AppState, handlers::sign_up};

pub fn configure_routes() -> Router<Arc<AppState>> {
    Router::new().route("/auth/sign-up", post(sign_up))
}
