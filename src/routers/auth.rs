use std::sync::Arc;

use axum::{
    routing::{patch, post},
    Router,
};

use crate::{
    app::AppState,
    handlers::{forgot_password, reset_password, sign_in, sign_up, verify_account},
};

pub fn configure_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/auth/sign-up", post(sign_up))
        .route("/auth/sign-in", post(sign_in))
        .route("/auth/verify-account", patch(verify_account))
        .route("/auth/forgot-password", post(forgot_password))
        .route("/auth/reset-password", patch(reset_password))
}
