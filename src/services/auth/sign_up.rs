use rand::{
    distributions::{Alphanumeric, DistString},
    Rng,
};
use time::{Duration, OffsetDateTime, PrimitiveDateTime};
use tokio::task::spawn_blocking;

use crate::{
    domain::{TransactionRepository, UserRepository},
    dto::SignUpRequest,
    email_client::EmailClient,
    error::Result,
    helpers::hash_password,
    services::ApplicationLogicError,
};

pub async fn sign_up<R: UserRepository, T: TransactionRepository>(
    client_base_url: &str,
    mut new_user: SignUpRequest,
    user_repository: &R,
    transaction_repository: &T,
    email_client: &EmailClient,
) -> Result<()> {
    let db_user = user_repository.get_by_email(&new_user.email).await?;

    if db_user.is_some() {
        return Err(ApplicationLogicError::UserAlreadyExists(new_user.email))?;
    }

    let password = new_user.password.clone();

    new_user.password = spawn_blocking(move || hash_password(&password)).await??;

    let token = Alphanumeric.sample_string(&mut rand::thread_rng(), 30);

    let token_expires = OffsetDateTime::now_utc().saturating_add(Duration::days(1));

    transaction_repository
        .save_user_and_verification_token(
            &new_user,
            &token,
            PrimitiveDateTime::new(token_expires.date(), token_expires.time()),
        )
        .await?;

    if !send_verification_email(&email_client, &new_user.email, &client_base_url, &token).await? {
        return Err(ApplicationLogicError::SendingEmailError)?;
    }

    Ok(())
}

#[tracing::instrument(
    name = "Sending verification email",
    skip(email_client, client_base_url, token)
)]
pub async fn send_verification_email(
    email_client: &EmailClient,
    to: &str,
    client_base_url: &str,
    token: &str,
) -> Result<bool> {
    let url = format!("{}/verify-account?token={}", client_base_url, token);

    let body = format!(
        r#"
	 Welcome to Netowork!<br/>
	 Click <a href="{}">here</a> to verify your account.
	"#,
        url
    );

    email_client
        .send_email(to, "Account verification", &body)
        .await
}
