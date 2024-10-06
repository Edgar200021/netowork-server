use serde::Deserialize;

use crate::{
    domain::{DomainError, FirstName, LastName, NewUser, UserEmail, UserPassword, UserRole},
    error::{Error, Result},
};

#[derive(Deserialize)]
pub struct SignUpRequest {
    pub email: String,
    pub password: String,
    pub password_confirm: String,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
}

impl TryFrom<SignUpRequest> for NewUser {
    type Error = Error;

    fn try_from(new_user: SignUpRequest) -> Result<Self> {
        if new_user.password != new_user.password_confirm {
            return Err(DomainError::PasswordsNotMatch)?;
        }

        Ok(Self {
            email: UserEmail::parse(&new_user.email)?,
            password: UserPassword::parse(&new_user.password)?,
            password_confirm: UserPassword::parse(&new_user.password_confirm)?,
            first_name: FirstName::parse(&new_user.first_name)?,
            last_name: LastName::parse(&new_user.last_name)?,
            role: UserRole::parse(&new_user.role)?,
        })
    }
}
