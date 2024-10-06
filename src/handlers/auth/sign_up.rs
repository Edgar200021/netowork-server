use std::sync::Arc;

use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::Deserialize;

use crate::startup::AppState;

#[derive(Deserialize)]
pub struct SignUpData {
    email: String,
    password: String,
}

pub async fn sign_up(
    State(state): State<Arc<AppState>>,
    Json(data): Json<SignUpData>,
) -> impl IntoResponse {
    StatusCode::OK
}
