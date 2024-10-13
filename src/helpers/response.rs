use std::collections::HashMap;

use axum::{
    body::Body,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::{json, Value};

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

pub fn send_json(status: Status, data: Value) -> Response<Body> {
    Json(json!({ "status": status.as_ref(), "data": data })).into_response()
}

pub fn send_error(message: &str) -> Response<Body> {
    Json(json!({ "status": Status::Error.as_ref(), "message": message })).into_response()
}

pub fn send_validation_error(messages: HashMap<&str, &str>) -> Response<Body> {
    Json(json!({ "status": Status::Error.as_ref(), "messages": messages })).into_response()
}
