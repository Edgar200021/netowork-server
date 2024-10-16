use derive_more::derive::From;

#[derive(From, Debug)]
pub enum ApplicationLogicError {
    UserAlreadyExists(String),
    UserNotFound,
    #[from]
    PasswordHash(argon2::password_hash::Error),
    InvalidCredentials,
    Unauthorized,
    PermissionDenied,
    SomethingWentWrong,
    SendingEmailError,
    VerificationTokenNotFound,
    VerificationTokenExpires,
    PasswordResetTokenNotFound,
	PasswordResetTokenExpires,
    NotVerified,
    #[from]
    JwtError(jsonwebtoken::errors::Error),
    #[from]
    InvalidSmtpAddress(lettre::address::AddressError),
    #[from]
    RequestError(reqwest::Error),
}
