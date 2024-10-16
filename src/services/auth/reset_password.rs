use core::str;

use rand::Rng;
use time::OffsetDateTime;
use tokio::task::spawn_blocking;

use crate::{
    domain::{PasswordResetTokenRepository, UserRepository},
    dto::ResetPasswordRequest,
    error::Result,
    helpers::hash_password,
    services::ApplicationLogicError,
};

pub async fn reset_password<U: UserRepository, T: PasswordResetTokenRepository>(
    data: ResetPasswordRequest,
    user_repository: &U,
    password_reset_token_repository: &T,
) -> Result<()> {
    let (user, token) = tokio::join!(
        user_repository.get_by_email(&data.email),
        password_reset_token_repository.get(&data.token)
    );

    let user = user?.ok_or(ApplicationLogicError::UserNotFound)?;
    let token = token?.ok_or(ApplicationLogicError::PasswordResetTokenNotFound)?;

    if token.expires.assume_utc().unix_timestamp() < OffsetDateTime::now_utc().unix_timestamp() {
        password_reset_token_repository.delete(&data.token).await?;
        return Err(ApplicationLogicError::PasswordResetTokenExpires)?;
    }

    let hashed_password = spawn_blocking(move || hash_password(&data.password)).await??;

    user_repository
        .update_password(user.id, &hashed_password)
        .await?;

    Ok(())
}
