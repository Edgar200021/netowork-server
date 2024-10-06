use unicode_segmentation::UnicodeSegmentation;

use crate::{domain::DomainError, error::Result};

#[derive(Debug)]
pub struct FirstName(String);

impl FirstName {
    pub fn parse(s: &str) -> Result<Self> {
        let is_empty_or_whitespace = s.trim().is_empty();

        let is_too_long = s.graphemes(true).count() > 256;

        let forbidden_characters = ['/', '(', ')', '"', '<', '>', '\\', '{', '}', '.', ','];
        let contains_forbidden_characters = s.chars().any(|g| forbidden_characters.contains(&g));

        if is_empty_or_whitespace || is_too_long || contains_forbidden_characters {
            Err(DomainError::InvalidName(format!(
                "{} is not a valid user name ",
                s
            )))?
        } else {
            Ok(Self(s.to_string()))
        }
    }
}

impl AsRef<str> for FirstName {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::FirstName;
    use claim::{assert_err, assert_ok};

    #[test]
    fn a_256_grapheme_long_name_is_valid() {
        let name = "a".repeat(256);

        assert_ok!(FirstName::parse(name.as_str()));
    }

    #[test]
    fn a_name_longer_than_256_graphemes_is_rejected() {
        let name = "a".repeat(257);

        assert_err!(FirstName::parse(name.as_str()));
    }

    #[test]
    fn whitespace_only_name_is_rejected() {
        let name = " ";

        assert_err!(FirstName::parse(name));
    }

    #[test]
    fn empty_name_is_rejected() {
        let name = "";

        assert_err!(FirstName::parse(name));
    }
}
