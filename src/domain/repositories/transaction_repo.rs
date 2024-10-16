use time::PrimitiveDateTime;

use crate::{dto::SignUpRequest, error::Result, models::Token};

#[trait_variant::make(HttpService: Send)]
pub trait TransactionRepository {
    async fn save_user_and_verification_token(
        &self,
        user: &SignUpRequest,
        token: &str,
        expires: PrimitiveDateTime,
    ) -> Result<()>;

    async fn delete_token_and_update_is_verified(&self, token: Token) -> Result<()>;
}
