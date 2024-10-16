use time::PrimitiveDateTime;

use crate::{dto::SignUpRequest, error::Result};

#[trait_variant::make(HttpService: Send)]
pub trait TransactionRepository {
    async fn save_user_and_verification_token(
        &self,
        user: &SignUpRequest,
        token: &str,
        expires: PrimitiveDateTime,
    ) -> Result<()>;
}
