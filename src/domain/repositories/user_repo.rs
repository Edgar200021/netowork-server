use crate::{dto::SignUpRequest, error::Result, models::User};

#[trait_variant::make(HttpService: Send)]
pub trait UserRepository {
    async fn get_user_by_email(&self, email: &str) -> Result<Option<User>>;
    async fn create_user(&self, new_user: SignUpRequest) -> Result<i32>;
}
