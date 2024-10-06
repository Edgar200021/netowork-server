use std::{sync::Arc, time::Duration};

use axum::{
    error_handling::HandleErrorLayer,
    http::{Method, Request, StatusCode},
    routing::get,
    serve::Serve,
    BoxError, Router,
};
use sqlx::PgPool;
use tokio::net::TcpListener;
use tower::{buffer::BufferLayer, limit::RateLimitLayer, ServiceBuilder};
use tower_http::{
    self,
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    timeout::TimeoutLayer,
    trace::TraceLayer,
};
use tracing::info_span;
use uuid::Uuid;

use crate::{db::Database, handlers::health_check, helpers::send_error, routes::configure_routes};

pub struct AppState {
    pub db: Database,
}

pub fn run(listener: TcpListener, db: Database) -> Serve<Router, Router> {
    let app = Router::new()
        .route("/health_check", get(health_check))
        .nest("/api", configure_routes())
        .layer(
            ServiceBuilder::new()
                .layer(HandleErrorLayer::new(|err: BoxError| async move {
                    tracing::error!("Unhandled error {err}");

                    send_error(StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong")
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
                .layer(RateLimitLayer::new(5, Duration::from_secs(1)))
                .layer(TimeoutLayer::new(Duration::from_secs(30))),
        )
        .with_state(Arc::new(AppState { db }));

    axum::serve(listener, app)
}
