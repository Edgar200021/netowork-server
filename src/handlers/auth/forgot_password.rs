use std::sync::Arc;

use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
};
use validator::Validate;

use crate::{app::AppState, dto::ForgotPasswordRequest, error::Result, services};

#[tracing::instrument(name = "Forgot password", skip(state, data))]
pub async fn forgot_password(
    State(state): State<Arc<AppState>>,
    Json(data): Json<ForgotPasswordRequest>,
) -> Result<impl IntoResponse> {
    data.validate()?;

    services::forgot_password(
        &state.client_base_url,
        data,
        &state.database.user_repository,
        &state.database.password_reset_token_repository,
        &state.email_client,
    )
    .await?;

    Ok(StatusCode::OK)
}
