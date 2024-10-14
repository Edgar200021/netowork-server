use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct SignInRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,

    #[validate(length(
        min = 8,
        max = 32,
        message = "Password must be between 8 and 32 characters"
    ))]
    pub password: String,
}
