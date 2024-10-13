use crate::{error::Result, services::ApplicationLogicError};
use argon2::{
    password_hash::{rand_core::OsRng, Error, PasswordHasher, SaltString},
    Argon2, PasswordHash, PasswordVerifier,
};

pub fn hash_password(password: &str) -> Result<String> {
    let argon2 = Argon2::default();
    let salt = SaltString::generate(&mut OsRng);

    let hashed = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| ApplicationLogicError::PasswordHash(e))?
        .to_string();

    Ok(hashed)
}

pub async fn verify_hash(password: String, hashed_password: String) -> Result<()> {
    let parsed_hash = PasswordHash::new(hashed_password.as_ref())
        .map_err(|e| ApplicationLogicError::PasswordHash(e))?;

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|e| match e {
            Error::Password => ApplicationLogicError::InvalidCredentials,
            _ => ApplicationLogicError::PasswordHash(e),
        })?;

    Ok(())
}
