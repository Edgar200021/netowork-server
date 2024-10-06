use secrecy::{ExposeSecret, SecretString};
use serde::Deserialize;
use serde_aux::field_attributes::deserialize_number_from_string;
use sqlx::postgres::{PgConnectOptions, PgSslMode};

#[derive(Deserialize)]
pub struct Settings {
    pub application: ApplicationSettings,
    pub database: DatabaseSettings,
}

#[derive(Deserialize)]
pub struct ApplicationSettings {
    pub host: String,
    #[serde(deserialize_with = "deserialize_number_from_string")]
    pub port: u32,
}

#[derive(Deserialize)]
pub struct DatabaseSettings {
    pub username: String,
    pub host: String,
    #[serde(deserialize_with = "deserialize_number_from_string")]
    pub port: u16,
    pub password: SecretString,
    pub database_name: String,
    pub ssl_mode: bool,
}

impl DatabaseSettings {
    pub fn connect_options(&self) -> PgConnectOptions {
        let ssl_mode = if self.ssl_mode {
            PgSslMode::Require
        } else {
            PgSslMode::Prefer
        };

        PgConnectOptions::new()
            .username(&self.username)
            .port(self.port)
            .host(&self.host)
            .password(&self.password.expose_secret())
            .ssl_mode(ssl_mode)
            .database(&self.database_name)
    }

    pub fn connect_options_without_db(&self) -> PgConnectOptions {
        let ssl_mode = if self.ssl_mode {
            PgSslMode::Require
        } else {
            PgSslMode::Prefer
        };

        PgConnectOptions::new()
            .username(&self.username)
            .port(self.port)
            .host(&self.host)
            .password(&self.password.expose_secret())
            .ssl_mode(ssl_mode)
    }
}

static ENVIRONMENT_KEY: &str = "APP_ENV";

pub fn get_configuration() -> Result<Settings, config::ConfigError> {
    let current_directory = std::env::current_dir().expect("Failed to determine current directory");
    let config_directory = current_directory.join("config");

    let environment: Environment = std::env::var(ENVIRONMENT_KEY)
        .unwrap_or("local".into())
        .try_into()
        .expect("Failed to parse environment");

    let config_file = format!("{}.yaml", environment.as_str());

    let settings = config::Config::builder()
        .add_source(config::File::from(config_directory.join(config_file)))
        .build()?;

    settings.try_deserialize::<Settings>()
}

pub enum Environment {
    Production,
    Local,
}

impl Environment {
    fn as_str(&self) -> &'static str {
        match self {
            Self::Production => "production",
            Self::Local => "local",
        }
    }
}

impl TryFrom<String> for Environment {
    type Error = String;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.to_lowercase().as_str() {
            "production" => Ok(Self::Production),
            "local" => Ok(Self::Local),
            _ => Err(format!(
                "Environment must be production or local, got {}",
                value
            )),
        }
    }
}
