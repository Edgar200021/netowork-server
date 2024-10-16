use std::env::{self, current_dir};

use lettre::transport::smtp::authentication::Credentials;
use secrecy::{ExposeSecret, SecretString};
use serde::Deserialize;
use serde_aux::field_attributes::deserialize_number_from_string;
use sqlx::postgres::{PgConnectOptions, PgSslMode};

#[derive(Deserialize, Debug)]
pub struct ApplicationSettings {
    #[serde(deserialize_with = "deserialize_number_from_string")]
    pub port: u32,
    pub host: String,
    pub client_base_url: String,
}

#[derive(Deserialize, Debug)]
pub struct DatabaseSettings {
    pub username: String,
    pub password: SecretString,
    #[serde(deserialize_with = "deserialize_number_from_string")]
    pub port: u16,
    pub host: String,
    pub database_name: String,
    pub require_ssl: bool,
}

impl DatabaseSettings {
    pub fn connect_options(&self) -> PgConnectOptions {
        let ssl_mode = if self.require_ssl {
            PgSslMode::Allow
        } else {
            PgSslMode::Prefer
        };

        PgConnectOptions::new()
            .username(&self.username)
            .password(&self.password.expose_secret())
            .port(self.port)
            .host(&self.host)
            .database(&self.database_name)
            .ssl_mode(ssl_mode)
    }

    pub fn connect_options_without_db(&self) -> PgConnectOptions {
        let ssl_mode = if self.require_ssl {
            PgSslMode::Allow
        } else {
            PgSslMode::Prefer
        };

        PgConnectOptions::new()
            .username(&self.username)
            .password(&self.password.expose_secret())
            .port(self.port)
            .host(&self.host)
            .ssl_mode(ssl_mode)
    }
}

#[derive(Debug, Deserialize)]
pub struct SmtpSettings {
    pub sender: String,
    pub username: String,
    pub password: SecretString,
    pub host: String,
    #[serde(deserialize_with = "deserialize_number_from_string")]
    pub port: u16,
}

impl SmtpSettings {
    pub fn credentials(&self) -> Credentials {
        Credentials::new(
            self.username.clone(),
            self.password.expose_secret().to_string(),
        )
    }
}

#[derive(Debug, Deserialize)]
pub struct EmailSettings {
    pub url: String,
    pub api_token: SecretString,
    pub sender: String,
    pub timeout_duration_in_seconds: u8,
}

#[derive(Debug, Deserialize)]
pub struct RedisSettings {
    pub host: String,
    #[serde(deserialize_with = "deserialize_number_from_string")]
    pub port: u16,
}

impl RedisSettings {
    pub fn connection_string(&self) -> String {
        format!("redis://{}:{}", self.host, self.port)
    }
}

#[derive(Deserialize, Debug)]
pub struct JwtSettings {
    pub access_secret: SecretString,
    pub refresh_secret: SecretString,
    #[serde(deserialize_with = "deserialize_number_from_string")]
    pub access_exp_in_minutes: i64,
    #[serde(deserialize_with = "deserialize_number_from_string")]
    pub refresh_exp_in_minutes: i64,
    pub secure: bool,
}

#[derive(Deserialize, Debug)]
pub struct Settings {
    pub application: ApplicationSettings,
    pub database: DatabaseSettings,
    pub redis: RedisSettings,
    pub jwt: JwtSettings,
    pub email: EmailSettings,
}

const ENVIRONMENT_KEY: &'static str = "APP_ENV";

impl Settings {
    pub fn get_settings() -> Result<Settings, config::ConfigError> {
        let current_dir = current_dir().expect("Failed to determine current directory");
        let config_dir = current_dir.join("configs");

        let environment: Environment = env::var(ENVIRONMENT_KEY)
            .unwrap_or("local".into())
            .try_into()
            .expect("Failed to parse environment");

        let config_file = format!("{}.yaml", environment.as_ref());

        let settings = config::Config::builder()
            .add_source(config::File::from(config_dir.join(config_file)))
            .build()?;

        settings.try_deserialize::<Settings>()
    }
}

pub enum Environment {
    Production,
    Local,
}

impl AsRef<str> for Environment {
    fn as_ref(&self) -> &str {
        match self {
            Self::Production => "production",
            Self::Local => "local",
        }
    }
}

impl TryFrom<String> for Environment {
    type Error = String;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.trim().to_lowercase().as_str() {
            "production" => Ok(Self::Production),
            "local" => Ok(Self::Local),
            _ => Err(format!(
                "Unknown environment: {}, expected: [production, local] ",
                value
            )),
        }
    }
}
