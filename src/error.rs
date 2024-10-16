use std::collections::HashMap;

use axum::{http::StatusCode, response::IntoResponse};
use derive_more::derive::From;
use tokio::task::JoinError;

use crate::{
    helpers::{send_error, send_validation_error, Status},
    services::ApplicationLogicError,
};

pub type Result<T> = core::result::Result<T, AppError>;

#[derive(From, Debug)]
pub enum AppError {
    #[from]
    SqlError(sqlx::Error),

    #[from]
    ValidationError(validator::ValidationErrors),

    #[from]
    ApplicationLogicError(ApplicationLogicError),

    #[from]
    JoinHandle(JoinError),

    #[from]
    RedisError(redis::RedisError),

    #[from]
    Lettre(lettre::error::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        match self {
            Self::ApplicationLogicError(error) => match error {
                ApplicationLogicError::UserAlreadyExists(email) => (
                    StatusCode::BAD_REQUEST,
                    send_error(&format!("User with {} address already exists", email)),
                )
                    .into_response(),
                ApplicationLogicError::RequestError(err) => {
                    tracing::error!("Request error: {err:?}");

                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        send_error("Something went wrong"),
                    )
                        .into_response()
                }

                ApplicationLogicError::InvalidSmtpAddress(email) => (
                    StatusCode::BAD_REQUEST,
                    send_error(&format!("Invalid email address: {}", email)),
                )
                    .into_response(),
                ApplicationLogicError::JwtError(error) => {
                    tracing::error!("Jwt error: {error:?}\n Kind: {:?}", error.kind());
                    (StatusCode::UNAUTHORIZED, send_error("Unauthorized")).into_response()
                }
                ApplicationLogicError::PermissionDenied => {
                    (StatusCode::FORBIDDEN, send_error("Permission denied")).into_response()
                }
                ApplicationLogicError::InvalidCredentials => {
                    (StatusCode::BAD_REQUEST, send_error("Invalid credentials")).into_response()
                }
                ApplicationLogicError::Unauthorized => {
                    (StatusCode::UNAUTHORIZED, send_error("Unauthorized")).into_response()
                }

                ApplicationLogicError::NotVerified => {
                    (StatusCode::FORBIDDEN, send_error("Not verified")).into_response()
                }

                ApplicationLogicError::VerificationTokenExpires => (
                    StatusCode::BAD_REQUEST,
                    send_error("Verification token expired"),
                )
                    .into_response(),
                ApplicationLogicError::VerificationTokenNotFound => {
                    (StatusCode::NOT_FOUND, send_error("Token not found")).into_response()
                }

                ApplicationLogicError::SendingEmailError
                | ApplicationLogicError::SomethingWentWrong => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    send_error("Something went wrong"),
                )
                    .into_response(),

                ApplicationLogicError::UserNotFound => {
                    (StatusCode::BAD_REQUEST, send_error("User doesn't exists")).into_response()
                }

                ApplicationLogicError::PasswordHash(err) => {
                    tracing::error!("Error hashing password: {err:?}");

                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        send_error("Something went wrong"),
                    )
                        .into_response()
                }
            },
            Self::ValidationError(err) => {
                let field_errors = err.field_errors();

                let errors =
                    field_errors
                        .iter()
                        .fold(HashMap::new(), |mut acc, (field, errors)| {
                            if !errors.is_empty() && errors[0].message.is_some() {
                                acc.insert(*field, errors[0].message.as_ref().unwrap().as_ref());
                            }

                            acc
                        });

                (StatusCode::BAD_REQUEST, send_validation_error(errors)).into_response()
            }
            Self::RedisError(err) => {
                tracing::error!("Redis error: {err:?}");

                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    send_error("Something went wrong"),
                )
                    .into_response()
            }

            Self::Lettre(err) => {
                tracing::error!("Lettre error: {err:?}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    send_error("Something went wrong"),
                )
                    .into_response()
            }
            Self::SqlError(_) | Self::JoinHandle(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                send_error("Something went wrong"),
            )
                .into_response(),
        }
    }
}
