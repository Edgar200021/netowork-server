use std::sync::Arc;

use axum::{serve::Serve, Router};
use tokio::{net::TcpListener, sync::RwLock};

use crate::{
    configuration::Settings, db::Database, jwt_client::JwtClient, redis_client::RedisClient,
    routers::configure_routes,
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

        let db = Database::try_new(settings.database.connect_options())
            .await
            .expect("Failed to build application");

        let redis_client = RedisClient::try_new(settings.redis)
            .await
            .expect("Failed to create redis client");
        let jwt_client = JwtClient::new(settings.jwt);

        let server = run(listener, db, redis_client, jwt_client);

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
    pub redis_client: RwLock<RedisClient>,
    pub jwt_client: JwtClient,
}

pub fn run(
    listener: TcpListener,
    database: Database,
    redis_client: RedisClient,
    jwt_client: JwtClient,
) -> Serve<Router, Router> {
    let state = Arc::new(AppState {
        database,
        redis_client: RwLock::new(redis_client),
        jwt_client,
    });

    let app = configure_routes(state.clone());

    axum::serve(listener, app)
}
