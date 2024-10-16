use sqlx::{postgres::PgConnectOptions, PgPool};

mod token_repo;
mod transaction_repo;
mod user_repo;

pub use token_repo::*;
pub use transaction_repo::*;
pub use user_repo::*;

pub struct Database {
    pub pool: PgPool,
    pub user_repository: PgUserRepository,
    pub token_repository: PgTokenRepository,
    pub transaction_repository: PgTransactionRepository,
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
            token_repository: PgTokenRepository::new(pool.clone()),
            transaction_repository: PgTransactionRepository::new(pool.clone()),
        })
    }
}
