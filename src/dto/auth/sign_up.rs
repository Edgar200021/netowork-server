use crate::{
    helpers::{validate_str, validate_user_role},
    models::UserRole,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct SignUpRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,

    #[validate(length(
        min = 8,
        max = 32,
        message = "Password must be between 8 and 32 characters"
    ))]
    pub password: String,

    #[validate(must_match(other = "password", message = "Passwords must match"))]
    pub password_confirm: String,

    #[validate(custom(function = "validate_str", message = "Invalid first name"))]
    pub first_name: String,

    #[validate(custom(function = "validate_str", message = "Invalid first name"))]
    pub last_name: String,

    #[validate(custom(function = "validate_user_role",))]
    pub role: UserRole,
}
