use validator::ValidateLength;

use crate::domain::DomainError;

const MIN_CONST: u64 = 8;
const MAX_CONST: u64 = 32;

#[derive(Debug, PartialEq)]
pub struct UserPassword(String);

impl UserPassword {
    pub fn parse(s: &str) -> Result<Self, DomainError> {
        if s.trim().is_empty() {
            return Err(DomainError::InvalidPasswordError(
                "Password cannot be empty.".to_string(),
            ));
        }

        if !s.validate_length(Some(MIN_CONST), Some(MAX_CONST), None) {
            Err(DomainError::InvalidPasswordError(format!(
                "Password length must be between {} and {} characters. Given: {}",
                MIN_CONST,
                MAX_CONST,
                s.len()
            )))
        } else {
            Ok(Self(s.to_string()))
        }
    }
}

impl AsRef<str> for UserPassword {
    fn as_ref(&self) -> &str {
        &self.0
    }
}
