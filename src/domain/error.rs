#[derive(Debug)]
pub enum DomainError {
    InvalidEmailError(String),
    InvalidPasswordError(String),
    InvalidNameError(String),
    InvalidSurnameError(String),
    InvalidRoleError(String),
    PasswordsNotMatchError,
}
