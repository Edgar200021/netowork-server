use validator::ValidateEmail;

use crate::domain::DomainError;

#[derive(Debug)]
pub struct UserEmail(String);

impl UserEmail {
    pub fn parse(s: &str) -> Result<Self, DomainError> {
        if !s.validate_email() {
            Err(DomainError::InvalidEmailError(format!(
                "{} is not valid email",
                s
            )))
        } else {
            Ok(Self(s.to_string()))
        }
    }
}

impl AsRef<str> for UserEmail {
    fn as_ref(&self) -> &str {
        &self.0
    }
}
