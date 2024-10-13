use dotenv::dotenv;
use netowork::{app::Application, configuration::Settings, telemetry::init_subscriber};

#[tokio::main]
async fn main() {
    dotenv().ok();
    init_subscriber();

    let settings = Settings::get_settings().expect("Failed to read configuration");

    let app = Application::build(settings).await;

    app.run_until_stopped()
        .await
        .expect("Failed to run application");
}

#[tracing::instrument(name = "my span", level = "trace")]
fn test(name: &str) {
    tracing::error!("inside my_function!");
}
