use lettre::{message::IntoBody, Address, Message, SmtpTransport, Transport};

use crate::{configuration::SmtpSettings, error::Result, services::ApplicationLogicError};

pub struct SmtpClient {
    transport: SmtpTransport,
    sender: Address,
}

impl SmtpClient {
    pub async fn try_new(smtp_settings: SmtpSettings) -> core::result::Result<Self, String> {
        let credentials = smtp_settings.credentials();

        let sender = smtp_settings.sender.parse::<Address>().map_err(|e| {
            tracing::error!("Failed to parse sender address: {:?}", e);
            "Failed to parse sender address".to_string()
        })?;

        let transport = SmtpTransport::starttls_relay(&smtp_settings.host)
            .map_err(|e| {
                tracing::error!("Failed to connect to email server: {:?}", e);
                "Failed to connect to email server".to_string()
            })?
            .credentials(credentials)
            .build();

        Ok(Self { transport, sender })
    }
    #[tracing::instrument(
		name = "Send email",
		skip(self, to, subject, body),
		fields(
			to = %to,
		)
	)]
    pub async fn send<Body: IntoBody>(&self, to: String, subject: &str, body: Body) -> Result<()> {
        let to = to
            .parse::<Address>()
            .map_err(ApplicationLogicError::InvalidSmtpAddress)?;

        let message = Message::builder()
            .from(self.sender.clone().into())
            .to(to.into())
            .subject(subject)
            .body(body)?;

        self.transport.send(&message).unwrap();

        Ok(())
    }
}
