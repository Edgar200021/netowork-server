use std::sync::Arc;

use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};

use crate::{
    domain::NewUser,
    error::{Error, Result},
    helpers::send_json,
    models::SignUpRequest,
    startup::AppState,
};

pub async fn sign_up(
    State(state): State<Arc<AppState>>,
    Json(data): Json<SignUpRequest>,
) -> Result<impl IntoResponse> {
    let new_user: NewUser = data.try_into()?;

    Ok(StatusCode::OK)
}
