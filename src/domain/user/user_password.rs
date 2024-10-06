use validator::ValidateLength;

use crate::{domain::DomainError, error::Result};

const MIN_CONST: u64 = 8;
const MAX_CONST: u64 = 32;

#[derive(Debug, PartialEq)]
pub struct UserPassword(String);

impl UserPassword {
    pub fn parse(s: &str) -> Result<Self> {
        if s.trim().is_empty() {
            return Err(DomainError::InvalidPassword(
                "Password cannot be empty.".to_string(),
            ))?;
        }

        if !s.validate_length(Some(MIN_CONST), Some(MAX_CONST), None) {
            Err(DomainError::InvalidPassword(format!(
                "Password length must be between {} and {} characters. Given: {}",
                MIN_CONST,
                MAX_CONST + 1,
                s.len()
            )))?
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

#[cfg(test)]
mod tests {
    use super::UserPassword;
    use claim::{assert_err, assert_ok};

    #[test]
    fn empty_password_is_rejected() {
        let password = "";

        assert_err!(UserPassword::parse(password));
    }

    #[test]
    fn whitespace_only_password_is_rejected() {
        let password = "    ";

        assert_err!(UserPassword::parse(password));
    }

    #[test]
    fn a_password_longer_than_32_characters_is_rejected() {
        let password = "a".repeat(33);

        assert_err!(UserPassword::parse(password.as_str()));
    }

    #[test]
    fn a_password_between_1_and_33_characters_is_valid() {
        let password = "a".repeat(32);

        assert_ok!(UserPassword::parse(password.as_str()));
    }
}
