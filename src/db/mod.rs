use sqlx::{postgres::PgConnectOptions, PgPool};

pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn new(connect_options: PgConnectOptions) -> Result<Self, String> {
        let pool = PgPool::connect_with(connect_options).await.map_err(|e| {
            tracing::error!("{e}");
            "failed to connect to database".to_string()
        })?;

        Ok(Self { pool })
    }
}
