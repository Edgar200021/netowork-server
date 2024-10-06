use sqlx::PgPool;

use crate::error::Result;

use super::NewUser;

#[trait_variant::make(HttpService: Send)]
pub trait UserRepository {
    fn new(pool: PgPool) -> Self;
    async fn create(&self, new_user: NewUser) -> Result<i32>;
    async fn delete(&self, id: i32) -> Result<()>;
}
