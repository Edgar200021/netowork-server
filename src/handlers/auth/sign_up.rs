use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use validator::Validate;

use crate::app::AppState;
use crate::dto::SignUpRequest;
use crate::error::Result;
use crate::services;

#[tracing::instrument(
	name = "Sign up", 
	skip(state, data),
	 fields(
		user_name = %data.first_name,
		user_email = %data.email
	 ))]
pub async fn sign_up(
    State(state): State<Arc<AppState>>,
    Json(data): Json<SignUpRequest>,
) -> Result<impl IntoResponse> {
    data.validate()?;

    services::sign_up(data, &state.database.user_repository).await?;

    Ok(StatusCode::OK)
}
