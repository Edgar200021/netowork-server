use crate::{domain::TransactionRepository, dto::SignUpRequest, error::Result};
use sqlx::{Acquire, PgPool};
use time::PrimitiveDateTime;

pub struct PgTransactionRepository {
    pool: PgPool,
}

impl PgTransactionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl TransactionRepository for PgTransactionRepository {
    async fn save_user_and_verification_token(
        &self,
        user: &SignUpRequest,
        token: &str,
        expires: PrimitiveDateTime,
    ) -> Result<()> {
        let mut transaction = self.pool.begin().await?;

        let id = sqlx::query_scalar!(
            r#"
			INSERT INTO users (email, password, first_name, last_name, role)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id;
		"#,
            user.email,
            user.password,
            user.first_name,
            user.last_name,
            user.role.as_ref()
        )
        .fetch_one(&mut *transaction)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", e);
            e
        })?;

        sqlx::query!(
            r#"
				INSERT INTO verification_tokens 
				(user_id, token, expires)
				VALUES ($1, $2, $3)			
			"#,
            id,
            token,
            expires
        )
        .execute(&mut *transaction)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {e:?}");
            e
        })?;

        transaction.commit().await.map_err(|e| {
            tracing::error!("Failed to commit transaction: {e:?}");
            e
        })?;

        Ok(())
    }
}
