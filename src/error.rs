use axum::{
    body::Body,
    http::{Response, StatusCode},
    response::IntoResponse,
};
use derive_more::From;

use crate::domain::DomainError;

pub type Result<T> = core::result::Result<T, String>;

#[derive(Debug, From)]
pub enum Error {
    SqlError(sqlx::Error),

    #[from]
    DomainError(DomainError),
}

impl IntoResponse for Error {
    fn into_response(self) -> axum::response::Response {
        match self {
            Self::DomainError(error) => match error {
                DomainError::InvalidNameError(str) => Response::new(Body::empty()),
                _ => Response::new(Body::empty()),
            },
            Self::SqlError(_) => Response::new(Body::empty()),
        }
    }
}
