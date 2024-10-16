use std::collections::HashMap;

use axum::{
    body::Body,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use serde_json::json;

pub enum Status {
    Success,
    Error,
}

impl AsRef<str> for Status {
    fn as_ref(&self) -> &str {
        match self {
            Self::Success => "success",
            Self::Error => "error",
        }
    }
}

pub fn send_json<D: Serialize>(status: Status, data: D) -> Response<Body> {
    Json(json!({ "status": status.as_ref(), "data": data })).into_response()
}

pub fn send_error(message: &str) -> Response<Body> {
    Json(json!({ "status": Status::Error.as_ref(), "message": message })).into_response()
}

pub fn send_validation_error(messages: HashMap<&str, &str>) -> Response<Body> {
    Json(json!({ "status": Status::Error.as_ref(), "messages": messages })).into_response()
}
