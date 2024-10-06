#[derive(Debug)]
pub enum DomainError {
    InvalidEmail(String),
    InvalidPassword(String),
    InvalidName(String),
    InvalidSurname(String),
    InvalidRole(String),
    PasswordsNotMatch,
}
