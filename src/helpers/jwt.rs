use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use secrecy::{ExposeSecret, SecretString};
use serde::{Deserialize, Serialize};
use time::{Duration, OffsetDateTime};

use crate::{error::Result, services::ApplicationLogicError};

#[derive(Deserialize, Serialize, Debug)]
pub struct Claims<T: Sized> {
    pub sub: T,
    pub exp: i64,
}

pub fn generate_jwt(user_id: i32, exp_in_minutes: i64, secret: &SecretString) -> Result<String> {
    let expires = OffsetDateTime::now_utc() + Duration::minutes(exp_in_minutes);

    let claims = Claims {
        sub: user_id,
        exp: expires.unix_timestamp(),
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.expose_secret().as_ref()),
    )
    .map_err(ApplicationLogicError::JwtError)?;

    Ok(token)
}

pub fn verify_jwt(token: &str, secret: &SecretString) -> Result<Claims<i32>> {
    let token_data = decode::<Claims<i32>>(
        token,
        &DecodingKey::from_secret(secret.expose_secret().as_ref()),
        &Validation::default(),
    )
    .map_err(ApplicationLogicError::JwtError)?;

    Ok(token_data.claims)
}
