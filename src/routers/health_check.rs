use axum::{http::status::StatusCode, response::IntoResponse, Extension};

use crate::middlewares::UserId;

pub async fn health_check(Extension(UserId(id)): Extension<UserId>) -> impl IntoResponse {
    StatusCode::OK
}
