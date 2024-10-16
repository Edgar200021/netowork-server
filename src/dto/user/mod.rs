use serde::{Deserialize, Serialize};

use crate::models::{User, UserRole};

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role: UserRole,
}

impl From<User> for UserResponse {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            role: u.role,
        }
    }
}
