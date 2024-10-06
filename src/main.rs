use netowork_server::{
    configuration::{get_configuration, Settings},
    startup::run,
    telemetry::{get_subscriber, init_subscriber},
};
use sqlx::PgPool;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    let subscriber = get_subscriber("netowork".into(), "info".into(), std::io::stdout);

    init_subscriber(subscriber);

    let Settings {
        application,
        database,
    } = get_configuration().expect("Failed to read configuration");

    let pool = PgPool::connect_with(database.connect_options())
        .await
        .expect("Failed to connect to database");

    let listener = TcpListener::bind(format!("{}:{}", application.host, application.port))
        .await
        .expect("Failed to bind address");

    run(pool, listener).await.expect("Failed to running server")
}
