use validator::ValidateEmail;

use crate::{domain::DomainError, error::Result};

#[derive(Debug)]
pub struct UserEmail(String);

impl UserEmail {
    pub fn parse(s: &str) -> Result<Self> {
        if !s.validate_email() {
            Err(DomainError::InvalidEmail(format!(
                "{} is not valid email",
                s
            )))?
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

#[cfg(test)]
mod tests {
    use super::UserEmail;
    use claim::{assert_err, assert_ok};
    use fake::faker::internet::en::SafeEmail;
    use fake::Fake;

    #[test]
    fn empty_string_is_rejected() {
        let email = "";

        assert_err!(UserEmail::parse(email));
    }

    #[test]
    fn email_missing_at_symbol_is_rejected() {
        let email = "gmail.com";

        assert_err!(UserEmail::parse(email));
    }

    #[test]
    fn email_missing_subject_is_rejected() {
        let email = "@gmail.com";

        assert_err!(UserEmail::parse(email));
    }

    //#[test]
    //fn valid_emails_are_parsed_successfully() {
    //    let email = SafeEmail().fake();

    //    assert_ok!(UserEmail::parse(email));
    //}
}
