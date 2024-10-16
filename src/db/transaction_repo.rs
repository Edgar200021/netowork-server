use crate::{domain::TransactionRepository, dto::SignUpRequest, error::Result, models::Token};
use sqlx::PgPool;
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
    #[tracing::instrument(
        name = "Insert user and verification token into database",
        skip(self, user, token, expires)
    )]
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

    #[tracing::instrument(
        name = "Delete token and update user is_verified in database",
        skip(self, token)
    )]
    async fn delete_token_and_update_is_verified(&self, token: Token) -> Result<()> {
        let mut transaction = self.pool.begin().await?;

        sqlx::query!(
            r#"
				UPDATE users
				SET is_verified = true
				WHERE id = $1
			"#,
            token.user_id,
        )
        .execute(&mut *transaction)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", e);
            e
        })?;

        sqlx::query!(
            r#"
				DELETE FROM verification_tokens
				WHERE token = $1 
			"#,
            token.token
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
