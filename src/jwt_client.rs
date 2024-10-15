use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use secrecy::ExposeSecret;
use serde::{Deserialize, Serialize};
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use crate::{configuration::JwtSettings, error::Result, services::ApplicationLogicError};

pub struct JwtClient {
    settings: JwtSettings,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct AccessClaims<T: Sized> {
    pub sub: T,
    pub exp: i64,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct RefreshClaims<T: Sized> {
    pub sub: T,
    pub refresh_token_id: Uuid,
    pub exp: i64,
}

impl JwtClient {
    pub fn new(settings: JwtSettings) -> Self {
        Self { settings }
    }

    pub fn generate_access_jwt(&self, user_id: i32) -> Result<String> {
        let expires =
            OffsetDateTime::now_utc() + Duration::minutes(self.settings.access_exp_in_minutes);

        let claims = AccessClaims {
            sub: user_id,
            exp: expires.unix_timestamp(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.settings.access_secret.expose_secret().as_ref()),
        )
        .map_err(ApplicationLogicError::JwtError)?;

        Ok(token)
    }

    fn generate_refresh_jwt(&self, user_id: i32, refresh_token_id: Uuid) -> Result<String> {
        let expires =
            OffsetDateTime::now_utc() + Duration::minutes(self.settings.refresh_exp_in_minutes);

        let claims = RefreshClaims {
            sub: user_id,
            refresh_token_id,
            exp: expires.unix_timestamp(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.settings.refresh_secret.expose_secret().as_ref()),
        )
        .map_err(ApplicationLogicError::JwtError)?;

        Ok(token)
    }

    pub fn generate_tokens(&self, user_id: i32) -> Result<(String, String, Uuid)> {
        let refresh_token_id = Uuid::new_v4();

        let access_token = self.generate_access_jwt(user_id)?;
        let refresh_token = self.generate_refresh_jwt(user_id, refresh_token_id)?;

        Ok((access_token, refresh_token, refresh_token_id))
    }

    pub fn verify_access_jwt(&self, token: &str) -> Result<AccessClaims<i32>> {
        let token_data = decode::<AccessClaims<i32>>(
            token,
            &DecodingKey::from_secret(self.settings.access_secret.expose_secret().as_ref()),
            &Validation::default(),
        )
        .map_err(ApplicationLogicError::JwtError)?;

        Ok(token_data.claims)
    }

    pub fn verify_refresh_jwt(&self, token: &str) -> Result<RefreshClaims<i32>> {
        let token_data = decode::<RefreshClaims<i32>>(
            token,
            &DecodingKey::from_secret(self.settings.refresh_secret.expose_secret().as_ref()),
            &Validation::default(),
        )
        .map_err(ApplicationLogicError::JwtError)?;

        Ok(token_data.claims)
    }

    pub fn access_exp_in_minutes(&self) -> i64 {
        self.settings.access_exp_in_minutes
    }
    pub fn refresh_exp_in_minutes(&self) -> i64 {
        self.settings.refresh_exp_in_minutes
    }
    pub fn secure(&self) -> bool {
        self.settings.secure
    }
}
