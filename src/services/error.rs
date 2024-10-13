use derive_more::derive::From;

#[derive(From)]
pub enum ApplicationLogicError {
    UserAlreadyExists(String),
    #[from]
    PasswordHash(argon2::password_hash::Error),
    InvalidCredentials,
}
