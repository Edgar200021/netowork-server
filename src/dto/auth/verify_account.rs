use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Validate, Deserialize)]
pub struct VerifyAccountRequest {
    #[validate(length(min = 1, message = "Token is required"))]
    pub token: String,
}
