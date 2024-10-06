use axum::{self, Json};
use axum::{
    body::Body,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::{json, Value};

pub fn send_json(status: StatusCode, data: Value) -> Response<Body> {
    Json(json!({ "status": status.as_u16(), "data": data })).into_response()
}

pub fn send_error(status: StatusCode, message: &str) -> Response<Body> {
    Json(json!({ "status": status.as_u16(), "message": message })).into_response()
}
