use core::str;

use rand::{
    distributions::{Alphanumeric, DistString},
    Rng,
};
use time::{Duration, OffsetDateTime, PrimitiveDateTime};

use crate::{
    domain::{PasswordResetTokenRepository, UserRepository},
    dto::ForgotPasswordRequest,
    email_client::EmailClient,
    error::Result,
    services::ApplicationLogicError,
};

pub async fn forgot_password<U: UserRepository, T: PasswordResetTokenRepository>(
    client_base_url: &str,
    data: ForgotPasswordRequest,
    user_repository: &U,
    password_reset_token_repository: &T,
    email_client: &EmailClient,
) -> Result<()> {
    let user = user_repository
        .get_by_email(&data.email)
        .await?
        .ok_or(ApplicationLogicError::UserNotFound)?;

    let token = Alphanumeric.sample_string(&mut rand::thread_rng(), 30);

    let token_expires = OffsetDateTime::now_utc().saturating_add(Duration::minutes(10));

    password_reset_token_repository
        .create(
            user.id,
            &token,
            PrimitiveDateTime::new(token_expires.date(), token_expires.time()),
        )
        .await?;

    send_password_reset_email(email_client, &user.email, client_base_url, &token).await?;

    Ok(())
}

#[tracing::instrument(
    name = "Sending password reset email",
    skip(email_client, client_base_url, token)
)]
pub async fn send_password_reset_email(
    email_client: &EmailClient,
    to: &str,
    client_base_url: &str,
    token: &str,
) -> Result<bool> {
    let url = format!(
        "{}/reset-password?token={}&email={}",
        client_base_url, token, to
    );

    let body = format!(
        r#"
	 Welcome to Netowork!<br/>
	 Click <a href="{}">here</a> to reset your password.
	"#,
        url
    );

    email_client.send_email(to, "Reset password", &body).await
}
