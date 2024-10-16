use crate::{dto::SignUpRequest, error::Result, models::User};

#[trait_variant::make(HttpService: Send)]
pub trait UserRepository {
    async fn get_by_email(&self, email: &str) -> Result<Option<User>>;
    async fn get_by_id(&self, id: i32) -> Result<Option<User>>;
    async fn create(&self, new_user: SignUpRequest) -> Result<i32>;
    async fn update_is_verified(&self, id: i32, is_verified: bool) -> Result<()>;
    async fn update_password(&self, id: i32, hashed_password: &str) -> Result<()>;
}
