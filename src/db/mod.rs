use sqlx::{postgres::PgConnectOptions, PgPool};
use user_repository::PgUserRepository;

use crate::domain::UserRepository;

mod user_repository;

#[derive(Clone)]
pub struct Database {
    pool: PgPool,
    pub user_repository: PgUserRepository,
}

impl Database {
    pub async fn try_new(connect_options: PgConnectOptions) -> Result<Self, String> {
        let pool = PgPool::connect_with(connect_options)
            .await
            .map_err(|_| "Failed to connect to dabase".to_string())?;

        Ok(Self {
            pool: pool.clone(),
            user_repository: PgUserRepository::new(pool.clone()),
        })
    }

    pub async fn run_migration(&self) -> Result<(), String> {
        sqlx::migrate!("./migrations")
            .run(&self.pool)
            .await
            .map_err(|_| "Failed to migrate the database".to_string())?;

        Ok(())
    }
}
