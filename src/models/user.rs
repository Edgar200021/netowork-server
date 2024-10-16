use serde::{Deserialize, Serialize};

#[derive(sqlx::Type, Debug, Serialize, Deserialize)]
#[sqlx(type_name = "user-role", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    Client,
    Freelancer,
}

impl AsRef<str> for UserRole {
    fn as_ref(&self) -> &str {
        match self {
            Self::Admin => "admin",
            Self::Client => "client",
            Self::Freelancer => "freelancer",
        }
    }
}

#[derive(Debug, sqlx::Type)]
pub struct User {
    pub id: i32,
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub role: UserRole,
    pub is_verified: bool,
    pub created_at: time::PrimitiveDateTime,
    pub updated_at: time::PrimitiveDateTime,
}
