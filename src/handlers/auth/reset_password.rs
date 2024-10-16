use std::sync::Arc;

use axum::{
    extract::{Json, State},
	http::StatusCode,
    response::IntoResponse,
};
use validator::Validate;

use crate::{app::AppState, dto::ResetPasswordRequest, error::Result, services};

#[tracing::instrument(
	name = "Reset password", 
	skip(state, data), 
	fields(
	user_email =  %data.email
))]
pub async fn reset_password(
    State(state): State<Arc<AppState>>,
    Json(data): Json<ResetPasswordRequest>,
) -> Result<impl IntoResponse> {

	data.validate()?;

	services::reset_password(data, &state.database.user_repository, &state.database.password_reset_token_repository).await?;
	
    Ok(StatusCode::OK)
}
