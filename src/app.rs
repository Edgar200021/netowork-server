use std::sync::Arc;

use axum::{serve::Serve, Router};
use tokio::{net::TcpListener, sync::RwLock};

use crate::{
    configuration::Settings, db::Database, email_client::EmailClient, jwt_client::JwtClient,
    redis_client::RedisClient, routers::configure_routes,
};

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

        let (db, redis_client) = tokio::join!(
            Database::try_new(settings.database.connect_options()),
            RedisClient::try_new(settings.redis),
        );

        let db = db.expect("Failed to build application");

        let redis_client = redis_client.expect("Failed to create redis client");
        let jwt_client = JwtClient::new(settings.jwt);
        let email_client =
            EmailClient::try_new(settings.email).expect("Failed to build email client");

        let server = run(
            settings.application.client_base_url,
            listener,
            db,
            redis_client,
            jwt_client,
            email_client,
        );

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
    pub client_base_url: String,
    pub database: Database,
    pub redis_client: RwLock<RedisClient>,
    pub jwt_client: JwtClient,
    pub email_client: EmailClient,
}

pub fn run(
    client_base_url: String,
    listener: TcpListener,
    database: Database,
    redis_client: RedisClient,
    jwt_client: JwtClient,
    email_client: EmailClient,
) -> Serve<Router, Router> {
    let state = Arc::new(AppState {
        client_base_url,
        database,
        redis_client: RwLock::new(redis_client),
        jwt_client,
        email_client,
    });

    let app = configure_routes(state.clone());

    axum::serve(listener, app)
}
