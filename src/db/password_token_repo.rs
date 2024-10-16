use crate::{domain::PasswordResetTokenRepository, error::Result, models::Token};
use sqlx::PgPool;
use time::PrimitiveDateTime;

pub struct PgPasswordResetTokenRepository {
    pool: PgPool,
}

impl PgPasswordResetTokenRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl PasswordResetTokenRepository for PgPasswordResetTokenRepository {
    #[tracing::instrument(
        name = "Insert new password reset token into database",
        skip(self, user_id, token, expires)
    )]
    async fn create(&self, user_id: i32, token: &str, expires: PrimitiveDateTime) -> Result<()> {
        sqlx::query!(
            r#"
				INSERT INTO password_reset_tokens
				(user_id, token, expires)
				VALUES ($1, $2, $3)			
			"#,
            user_id,
            token,
            expires
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {e:?}");
            e
        })?;

        Ok(())
    }

    #[tracing::instrument(name = "Get password reset token from database", skip(self, token))]
    async fn get(&self, token: &str) -> Result<Option<Token>> {
        let token = sqlx::query_as!(
            Token,
            r#"
			SELECT * FROM password_reset_tokens
			WHERE token = $1
		"#,
            token
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {e:?}");
            e
        })?;

        Ok(token)
    }

    #[tracing::instrument(name = "Delete password reset token from database", skip(self, token))]
    async fn delete(&self, token: &str) -> Result<()> {
        sqlx::query!(
            r#"
				DELETE FROM password_reset_tokens
				WHERE token = $1 
			"#,
            token
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {e:?}");
            e
        })?;

        Ok(())
    }
}
