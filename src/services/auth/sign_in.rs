use tokio::task::spawn_blocking;

use crate::{
    domain::UserRepository, dto::{SignInRequest, UserResponse}, error::Result, helpers::verify_hash, jwt_client::JwtClient, models::User, redis_client::RedisClient, services::ApplicationLogicError
};

pub async fn sign_in<R: UserRepository>(
    data: SignInRequest,
    user_repository: &R,
    jwt_client: &JwtClient,
    redis_client: &mut RedisClient,
) -> Result<(UserResponse, String, String)> {
    let db_user = user_repository
        .get_by_email(&data.email)
        .await?
        .ok_or(ApplicationLogicError::InvalidCredentials)?;

    let db_user = spawn_blocking(|| -> Result<User> {
        verify_hash(data.password, &db_user.password)?;
        Ok(db_user)
    })
    .await??;

    if !db_user.is_verified {
        return Err(ApplicationLogicError::NotVerified)?;
    }

    let (access_token, refresh_token, refresh_token_id) = jwt_client.generate_tokens(db_user.id)?;

    redis_client
        .insert(db_user.id.to_string(), refresh_token_id.to_string())
        .await?;

    Ok((db_user.into(), access_token, refresh_token))
}
