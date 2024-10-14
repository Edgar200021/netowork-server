use tokio::task::spawn_blocking;

use crate::{
    domain::UserRepository, dto::SignInRequest, error::Result, helpers::verify_hash,
    jwt_client::JwtClient, services::ApplicationLogicError,
};

pub async fn sign_in<R: UserRepository>(
    data: SignInRequest,
    user_repository: &R,
    jwt_client: &JwtClient,
) -> Result<(String, String)> {
    let db_user = user_repository
        .get_user_by_email(&data.email)
        .await?
        .ok_or(ApplicationLogicError::InvalidCredentials)?;

    spawn_blocking(|| verify_hash(data.password, db_user.password)).await??;

    jwt_client.generate_tokens(db_user.id)
}
