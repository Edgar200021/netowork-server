use unicode_segmentation::UnicodeSegmentation;

use crate::domain::DomainError;

#[derive(Debug)]
pub struct UserName(String);

impl UserName {
    pub fn parse(s: String) -> Result<Self, DomainError> {
        let is_empty_or_whitespace = s.trim().is_empty();

        let is_too_long = s.graphemes(true).count() > 256;

        let forbidden_characters = ['/', '(', ')', '"', '<', '>', '\\', '{', '}', '.', ','];
        let contains_forbidden_characters = s.chars().any(|g| forbidden_characters.contains(&g));

        if is_empty_or_whitespace || is_too_long || contains_forbidden_characters {
            Err(DomainError::InvalidNameError(format!(
                "{} is not a valid user name ",
                s
            )))
        } else {
            Ok(Self(s))
        }
    }
}

impl AsRef<str> for UserName {
    fn as_ref(&self) -> &str {
        &self.0
    }
}
