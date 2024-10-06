use serde::de;
use sqlx::PgPool;

use crate::{
    domain::{NewUser, UserRepository},
    error::Result,
};

#[derive(Clone)]
pub struct PgUserRepository {
    pool: PgPool,
}

impl UserRepository for PgUserRepository {
    fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    #[tracing::instrument(name = "Saving new user in database", skip(self, new_user))]
    async fn create(&self, new_user: NewUser) -> Result<i32> {
        let id = sqlx::query_scalar!(
            r#"
        		INSERT INTO users (email, password, first_name, last_name, role)
        		VALUES ($1, $2, $3, $4, $5)
				RETURNING id
     	   "#,
            new_user.email.as_ref(),
            new_user.password.as_ref(),
            new_user.first_name.as_ref(),
            new_user.last_name.as_ref(),
            new_user.role.as_ref(),
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", 3);
            e
        })?;

        Ok(id)
    }

    #[tracing::instrument(name = "Deleting user from database", skip(self, id))]
    async fn delete(&self, id: i32) -> Result<()> {
        sqlx::query!(
            r#"
				DELETE FROM users
				WHERE id = $1
	   		"#,
            id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", 3);
            e
        })?;

        Ok(())
    }
}
