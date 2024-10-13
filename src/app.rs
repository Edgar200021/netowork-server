use core::error;
use std::{sync::Arc, time::Duration};

use axum::{
    error_handling::HandleErrorLayer,
    http::{Method, Request, StatusCode},
    routing::get,
    serve::Serve,
    BoxError, Router,
};
use tokio::{net::TcpListener, runtime::Handle};
use tower::{buffer::BufferLayer, limit::RateLimitLayer, ServiceBuilder};
use tower_http::{
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    timeout::TimeoutLayer,
    trace::TraceLayer,
};
use tracing::info_span;
use uuid::Uuid;

use crate::{configuration::Settings, db::Database, routers::configure_routes};

pub struct Application {
    port: u16,
    server: Serve<Router, Router>,
}

impl Application {
    pub async fn build(settings: Settings) -> Self {
        let addr = format!(
            "{}:{}",
            settings.application.host, settings.application.port
        );

        let listener = TcpListener::bind(addr)
            .await
            .expect("Failed to bind address");

        let port = listener.local_addr().unwrap().port();

        let db = Database::new(settings.database.connect_options())
            .await
            .expect("Failed to build application");

        let server = run(listener, db);

        Self { port, server }
    }

    pub fn port(&self) -> u16 {
        self.port
    }

    pub async fn run_until_stopped(self) -> Result<(), std::io::Error> {
        self.server.await
    }
}

pub struct AppState {
    database: Database,
}

pub fn run(listener: TcpListener, database: Database) -> Serve<Router, Router> {
    let app = configure_routes()
        .layer(
            ServiceBuilder::new()
                .layer(HandleErrorLayer::new(|err: BoxError| async move {
                    tracing::error!("Unahndled error {err}");

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
        .with_state(Arc::new(AppState { database }));

    axum::serve(listener, app)
}
