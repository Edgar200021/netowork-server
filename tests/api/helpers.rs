use netowork::{
    app::Application,
    configuration::{DatabaseSettings, Settings},
    db::Database,
};
use reqwest::{redirect, Body, Client};
use sqlx::{Connection, Executor, PgConnection};
use uuid::Uuid;

pub async fn configure_database(database_settings: &DatabaseSettings) -> Database {
    let mut db = PgConnection::connect_with(&database_settings.connect_options_without_db())
        .await
        .expect("Failed to connect to database");

    db.execute(format!(r#"CREATE DATABASE "{}";"#, database_settings.database_name).as_str())
        .await
        .expect("Failed to create database");

    let db = Database::try_new(database_settings.connect_options())
        .await
        .expect("Failed to connect to postgres");

    sqlx::migrate!("./migrations")
        .run(&db.pool)
        .await
        .expect("Failed to run migrations");

    db
}

pub struct TestApp {
    pub db: Database,
    pub api_client: reqwest::Client,
    pub address: String,
}

impl TestApp {
    pub async fn build() -> Self {
        let settings = {
            let mut s = Settings::get_settings().expect("Failed to read configuration");

            s.application.port = 0;
            s.database.database_name = Uuid::new_v4().to_string();

            s
        };

        let db = configure_database(&settings.database).await;
        let app = Application::build(settings).await;

        let address = format!("http://127.0.0.1:{}/api", app.port());

        tokio::spawn(app.run_until_stopped());

        let api_client = Client::builder()
            .redirect(redirect::Policy::none())
            .build()
            .expect("Failed to create api_client");

        Self {
            db,
            address,
            api_client,
        }
    }

    pub async fn post_sign_up(&self, body: impl Into<Body>) -> reqwest::Response {
        self.api_client
            .post(format!("{}/auth/sign-up", self.address))
            .header("Content-Type", "application/json")
            .body(body)
            .send()
            .await
            .expect("Failed to execute request")
    }

    pub async fn post_sign_in(&self, body: impl Into<Body>) -> reqwest::Response {
        self.api_client
            .post(format!("{}/auth/sign-in", self.address))
            .header("Content-Type", "application/json")
            .body(body)
            .send()
            .await
            .expect("Failed to execute request")
    }
}
