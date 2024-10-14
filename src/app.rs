use std::{sync::Arc, time::Duration};

use axum::{
    error_handling::HandleErrorLayer,
    http::{Method, Request, StatusCode},
    serve::Serve,
    BoxError, Router,
};
use tokio::net::TcpListener;
use tower::{buffer::BufferLayer, limit::RateLimitLayer, ServiceBuilder};
use tower_http::{
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    timeout::TimeoutLayer,
    trace::TraceLayer,
};
use tracing::info_span;
use uuid::Uuid;

use crate::{configuration::Settings, db::Database, jwt_client::JwtClient, routers::configure_routes};

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

        let db = Database::try_new(settings.database.connect_options())
            .await
            .expect("Failed to build application");

        let jwt_client = JwtClient::new(settings.jwt);

        let server = run(listener, db, jwt_client);

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
    pub database: Database,
    pub jwt_client: JwtClient,
}

pub fn run(
    listener: TcpListener,
    database: Database,
    jwt_client: JwtClient,
) -> Serve<Router, Router> {
    let state = Arc::new(AppState {
        database,
        jwt_client,
    });

    let app = configure_routes(state.clone())
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
        .with_state(state.clone());

    axum::serve(listener, app)
}
