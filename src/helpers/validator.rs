use std::borrow::Cow;

use unicode_segmentation::UnicodeSegmentation;
use validator::ValidationError;

use crate::models::UserRole;

pub fn validate_str(s: &str) -> Result<(), ValidationError> {
    let is_empty_or_whitespace = s.trim().is_empty();

    let is_too_long = s.graphemes(true).count() > 256;

    let forbidden_characters = ['/', '(', ')', '"', '<', '>', '\\', '{', '}', '.', ','];
    let contains_forbidden_characters = s.chars().any(|g| forbidden_characters.contains(&g));

    if is_empty_or_whitespace || is_too_long || contains_forbidden_characters {
        Err(ValidationError::new("Invalid string"))
    } else {
        Ok(())
    }
}

pub fn validate_user_role(r: &UserRole) -> Result<(), ValidationError> {
    match r {
        UserRole::Client | UserRole::Freelancer => Ok(()),
        _ => Err(ValidationError::new("Invalid user role")
            .with_message(Cow::from("Invalid user role, must be client or freelancer"))),
    }
}
