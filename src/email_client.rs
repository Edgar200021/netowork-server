use std::time::Duration;

use secrecy::ExposeSecret;
use serde_json::json;
use validator::Validate;

use crate::{configuration::EmailSettings, error::Result, services::ApplicationLogicError};

pub struct EmailClient {
    settings: EmailSettings,
    client: reqwest::Client,
}

impl EmailClient {
    pub fn try_new(settings: EmailSettings) -> core::result::Result<Self, String> {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(
                settings.timeout_duration_in_seconds as u64,
            ))
            .build()
            .map_err(|e| {
                tracing::error!("Failed to build email client: {:?}", e);
                "Failed to build email client".to_string()
            })?;

        Ok(Self { settings, client })
    }

    pub async fn send_email(&self, recipient: &str, subject: &str, html: &str) -> Result<bool> {
        let request = EmailRequest {
            from: &self.settings.sender,
            to: recipient,
            subject,
            html,
        };

        request.validate()?;

        let res = self
            .client
            .post(&self.settings.url)
            .header("Content-Type", "application/json")
            .header("Api-Token", self.settings.api_token.expose_secret())
            .body(
                json!({
                    "to": [
                    {
                        "email": request.to,
                    }
                    ],
                    "from": {
                       "email": request.from
                    },
                    "subject": request.subject,
                    "html": request.html,
                })
                .to_string(),
            )
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to send email: {:?}", e);
                ApplicationLogicError::RequestError(e)
            })?;

        Ok(res.status().is_success())
    }
}

#[derive(Debug, Validate)]
pub struct EmailRequest<'a> {
    #[validate(email(message = "Invalid email address"))]
    pub from: &'a str,
    #[validate(email(message = "Invalid email address"))]
    pub to: &'a str,
    pub subject: &'a str,
    pub html: &'a str,
}
