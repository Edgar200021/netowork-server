use axum::{
    error_handling::HandleErrorLayer, http::status::StatusCode, middleware, routing::get, Router,
};
use axum_extra::extract::CookieJar;

use std::{sync::Arc, time::Duration};

use axum::{
    http::{Method, Request},
    BoxError,
};
use tower::{buffer::BufferLayer, limit::RateLimitLayer, ServiceBuilder};
use tower_http::{
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    timeout::TimeoutLayer,
    trace::TraceLayer,
};
use tracing::info_span;
use uuid::Uuid;

mod auth;
mod health_check;

use crate::{app::AppState, middlewares::auth};
use health_check::*;

pub fn configure_routes(state: Arc<AppState>) -> Router<()> {
    Router::new()
        .nest(
            "/api",
            Router::new()
                .route("/health_check", get(health_check))
                .route_layer(middleware::from_fn_with_state(state.clone(), auth))
                .merge(auth::configure_routes()),
        )
        .layer(
            ServiceBuilder::new()
                .layer(HandleErrorLayer::new(|err: BoxError| async move {
                    tracing::error!("Unhandled error {err}");

                    StatusCode::INTERNAL_SERVER_ERROR
                }))
                .layer(
                    TraceLayer::new_for_http().make_span_with(|request: &Request<_>| {
                        let path = request.uri();
                        let request_id = Uuid::new_v4();
                        info_span!("http_request", %request_id, method = %request.method(), %path)
                    }),
                )
                .layer(
                    CorsLayer::new()
                        .allow_methods([
                            Method::GET,
                            Method::POST,
                            Method::PUT,
                            Method::PATCH,
                            Method::DELETE,
                            Method::OPTIONS,
                            Method::HEAD,
                        ])
                        .allow_origin(Any),
                )
                .layer(
                    CompressionLayer::new()
                        .br(true)
                        .gzip(true)
                        .zstd(true)
                        .deflate(true),
                )
                .layer(BufferLayer::new(1024))
                .layer(TimeoutLayer::new(Duration::from_secs(30)))
                .layer(RateLimitLayer::new(5, Duration::from_secs(2))),
        )
        .with_state(state.clone())
}
