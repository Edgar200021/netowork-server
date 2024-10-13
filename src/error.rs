use core::error;
use std::collections::HashMap;

use axum::{http::StatusCode, response::IntoResponse};
use derive_more::derive::From;
use tokio::task::JoinError;

use crate::{
    helpers::{send_error, send_validation_error},
    services::ApplicationLogicError,
};

pub type Result<T> = core::result::Result<T, AppError>;

#[derive(From)]
pub enum AppError {
    #[from]
    SqlError(sqlx::Error),

    #[from]
    ValidationError(validator::ValidationErrors),

    #[from]
    ApplicationLogicError(ApplicationLogicError),

    #[from]
    JoinHandle(JoinError),
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
                ApplicationLogicError::InvalidCredentials => {
                    (StatusCode::BAD_REQUEST, send_error("Invalid credentials")).into_response()
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
                println!("{err:?}");
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
            Self::SqlError(_) | Self::JoinHandle(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                send_error("Something went wrong"),
            )
                .into_response(),
        }
    }
}
