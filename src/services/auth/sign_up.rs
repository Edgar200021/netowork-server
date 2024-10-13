use tokio::task::spawn_blocking;

use crate::{
    domain::UserRepository, dto::SignUpRequest, error::Result, helpers::hash_password,
    services::ApplicationLogicError,
};

pub async fn sign_up<R: UserRepository>(
    mut new_user: SignUpRequest,
    user_repository: &R,
) -> Result<()> {
    let db_user = user_repository.get_user_by_email(&new_user.email).await?;

    if db_user.is_some() {
        return Err(ApplicationLogicError::UserAlreadyExists(new_user.email))?;
    }

    let password = new_user.password.clone();

    new_user.password = spawn_blocking(move || hash_password(&password)).await??;

    user_repository.create_user(new_user).await?;

    Ok(())
}
