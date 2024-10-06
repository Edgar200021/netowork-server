use crate::{domain::DomainError, helpers::send_error};
use axum::{http::StatusCode, response::IntoResponse};
use derive_more::From;

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Debug, From)]
pub enum Error {
    #[from]
    SqlError(sqlx::Error),

    #[from]
    DomainError(DomainError),
}

impl IntoResponse for Error {
    fn into_response(self) -> axum::response::Response {
        match self {
            Self::DomainError(error) => match error {
                DomainError::InvalidName(err)
                | DomainError::InvalidSurname(err)
                | DomainError::InvalidEmail(err)
                | DomainError::InvalidPassword(err)
                | DomainError::InvalidRole(err) => send_error(StatusCode::BAD_REQUEST, &err),
                DomainError::PasswordsNotMatch => send_error(StatusCode::BAD_REQUEST, "Passwords do not match. Please ensure that the entered passwords are identical."),
            },
            Self::SqlError(_) => send_error(StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong"),
        }
    }
}
