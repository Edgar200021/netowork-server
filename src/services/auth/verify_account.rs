use time::OffsetDateTime;

use crate::{
    domain::{TokenRepository, TransactionRepository, UserRepository},
    dto::VerifyAccountRequest,
    error::Result,
    services::ApplicationLogicError,
};

pub async fn verify_account<T: TokenRepository, U: UserRepository, R: TransactionRepository>(
    token_repository: &T,
    user_repository: &U,
    transaction_repository: &R,
    data: VerifyAccountRequest,
) -> Result<()> {
    let token = token_repository
        .get(&data.token)
        .await?
        .ok_or(ApplicationLogicError::VerificationTokenNotFound)?;

    if token.expires.assume_utc().unix_timestamp() < OffsetDateTime::now_utc().unix_timestamp() {
        token_repository.delete(&data.token).await?;
        return Err(ApplicationLogicError::VerificationTokenExpires)?;
    }

    if user_repository.get_by_id(token.user_id).await?.is_none() {
        token_repository.delete(&data.token).await?;
        return Err(ApplicationLogicError::UserNotFound)?;
    }

    transaction_repository
        .delete_token_and_update_is_verified(token)
        .await?;

    Ok(())
}
