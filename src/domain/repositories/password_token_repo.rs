use time::PrimitiveDateTime;

use crate::{error::Result, models::Token};

#[trait_variant::make(HttpService: Send)]
pub trait PasswordResetTokenRepository {
    async fn create(&self, user_id: i32, token: &str, expires: PrimitiveDateTime) -> Result<()>;
    async fn get(&self, token: &str) -> Result<Option<Token>>;
    async fn delete(&self, token: &str) -> Result<()>;
}
