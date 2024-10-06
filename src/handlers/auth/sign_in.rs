use std::sync::Arc;

use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::Deserialize;

use crate::startup::AppState;

#[derive(Deserialize)]
pub struct SignInData {
    email: String,
    password: String,
}

pub async fn sign_in(
    State(state): State<Arc<AppState>>,
    Json(data): Json<SignInData>,
) -> impl IntoResponse {
    StatusCode::OK
}
