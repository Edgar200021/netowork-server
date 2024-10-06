use super::{FirstName, LastName, UserEmail, UserPassword, UserRole};

#[derive(Debug)]
pub struct NewUser {
    pub email: UserEmail,
    pub password: UserPassword,
    pub password_confirm: UserPassword,
    pub first_name: FirstName,
    pub last_name: LastName,
    pub role: UserRole,
}
