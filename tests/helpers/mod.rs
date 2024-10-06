use netowork_server::{
    configuration::{get_configuration, DatabaseSettings},
    db::Database,
    startup::run,
    telemetry::{get_subscriber, init_subscriber},
};
use once_cell::sync::Lazy;
use sqlx::{Connection, Executor, PgConnection};
use tokio::net::TcpListener;
use uuid::Uuid;

static TRACING: Lazy<()> = Lazy::new(|| {
    let default_filter_level = "info".to_string();
    let subscriber_name = "test".to_string();

    if std::env::var("TEST_LOG").is_ok() {
        let subscriber = get_subscriber(subscriber_name, default_filter_level, std::io::stdout);
        init_subscriber(subscriber);
    } else {
        let subscriber = get_subscriber(subscriber_name, default_filter_level, std::io::sink);
        init_subscriber(subscriber);
    };
});

pub async fn configure_database(database_config: &DatabaseSettings) -> Database {
    let mut connection = PgConnection::connect_with(&database_config.connect_options_without_db())
        .await
        .expect("Failed to connect to database");

    connection
        .execute(format!(r#"CREATE DATABASE "{}";"#, database_config.database_name).as_str())
        .await
        .expect("Failed to create database.");

    let db = Database::try_new(database_config.connect_options())
        .await
        .expect("Failed to connect to dabase");

    db.run_migration()
        .await
        .expect("Failed to migrate the database");

    db
}

pub struct TestApp {
    pub address: String,
    pub db: Database,
}

impl TestApp {
    pub async fn try_start() -> Self {
        Lazy::force(&TRACING);

        let mut configuration = get_configuration().expect("Failed to read configuration");
        configuration.database.database_name = Uuid::new_v4().to_string();

        let db = configure_database(&configuration.database).await;

        let listener = TcpListener::bind(format!("{}:0", configuration.application.host))
            .await
            .expect("Failed to bind address");

        let port = listener.local_addr().unwrap().port();

        let server = run(listener, db.clone());

        tokio::spawn(async move { server.await.expect("Failed to running server") });

        TestApp {
            address: format!("http://{}:{}", configuration.application.host, port),
            db,
        }
    }
}
