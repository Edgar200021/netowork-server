use crate::{
    domain::UserRepository,
    dto::SignUpRequest,
    error::Result,
    models::{User, UserRole},
};
use sqlx::PgPool;

pub struct PgUserRepository {
    pool: PgPool,
}

impl PgUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl UserRepository for PgUserRepository {
    #[tracing::instrument(name = "Get user by email from database", skip(self, email))]
    async fn get_by_email(&self, email: &str) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
			SELECT id, email, password, first_name, last_name, role as "role: UserRole", is_verified, password_reset_token, password_reset_expires, created_at, updated_at
			FROM users 
			WHERE email = $1;
		"#,
            email
        ).fetch_optional(&self.pool).await.map_err(|e| {
			tracing::error!("Failed to execute query: {:?}", e);
			e
		})?;

        Ok(user)
    }

    #[tracing::instrument(name = "Get user by id from database", skip(self, id))]
    async fn get_by_id(&self, id: i32) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
			SELECT id, email, password, first_name, last_name, role as "role: UserRole", is_verified, password_reset_token, password_reset_expires, created_at, updated_at
			FROM users 
			WHERE id = $1;
		"#,
            id
        ).fetch_optional(&self.pool).await.map_err(|e| {
			tracing::error!("Failed to execute query: {:?}", e);
			e
		})?;

        Ok(user)
    }

    #[tracing::instrument(name = "Insert new user into database", skip(self, new_user))]
    async fn create(&self, new_user: SignUpRequest) -> Result<i32> {
        let id = sqlx::query_scalar!(
            r#"
			INSERT INTO users (email, password, first_name, last_name, role)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id;
		"#,
            new_user.email,
            new_user.password,
            new_user.first_name,
            new_user.last_name,
            new_user.role.as_ref()
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", e);
            e
        })?;

        Ok(id)
    }

    #[tracing::instrument(
        name = "Update user is_verified in database",
        skip(self, id, is_verified)
    )]
    async fn update_is_verified(&self, id: i32, is_verified: bool) -> Result<()> {
        sqlx::query!(
            r#"
			UPDATE users
			SET is_verified = $1
			WHERE id = $2
		"#,
            is_verified,
            id,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", e);
            e
        })?;

        Ok(())
    }
}
