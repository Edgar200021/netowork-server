use crate::helpers::TestApp;

#[tokio::test]

async fn health_check_works() {
    let TestApp {
        api_client,
        address,
        ..
    } = TestApp::build().await;

    let response = api_client
        .get(format!("{}/api/health_check", address))
        .send()
        .await
        .expect("Failed to execute request");

    assert!(response.status().is_success());
    assert_eq!(Some(0), response.content_length());
}
