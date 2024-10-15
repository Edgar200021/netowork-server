use sqlx::{postgres::PgConnectOptions, PgPool};

mod user_repo;
mod token_repo;

pub use user_repo::*;
pub use token_repo::*;

pub struct Database {
    pub pool: PgPool,
    pub user_repository: PgUserRepository,
}

impl Database {
    pub async fn try_new(connect_options: PgConnectOptions) -> Result<Self, String> {
        let pool = PgPool::connect_with(connect_options).await.map_err(|e| {
            tracing::error!("{e}");
            "failed to connect to database".to_string()
        })?;

        Ok(Self {
            pool: pool.clone(),
            user_repository: PgUserRepository::new(pool.clone()),
        })
    }
}
