use std::sync::Arc;

use axum::{
    extract::{Json, State},
    response::IntoResponse,
};
use validator::Validate;

use crate::{app::AppState, dto::VerifyAccountRequest, error::Result, services};

pub async fn verify_account(
    State(state): State<Arc<AppState>>,
    Json(data): Json<VerifyAccountRequest>,
) -> Result<impl IntoResponse> {
    data.validate()?;

    services::verify_account(
        &state.database.token_repository,
        &state.database.user_repository,
        &state.database.transaction_repository,
        data,
    )
    .await?;

    Ok(())
}
