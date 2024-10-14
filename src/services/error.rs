use derive_more::derive::From;

#[derive(From)]
pub enum ApplicationLogicError {
    UserAlreadyExists(String),
    UserNotFound,
    #[from]
    PasswordHash(argon2::password_hash::Error),
    InvalidCredentials,
    Unauthorized,
    PermissionDenied,
	SomethingWentWrong,
    #[from]
    JwtError(jsonwebtoken::errors::Error),
}
