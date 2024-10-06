use super::{UserEmail, UserName, UserPassword, UserRole, UserSurname};

#[derive(Debug)]
pub struct NewUser {
    pub email: UserEmail,
    pub password: UserPassword,
    pub password_confirm: UserPassword,
    pub name: UserName,
    pub surname: UserSurname,
    pub role: UserRole,
}
