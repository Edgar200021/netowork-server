mod helpers;

#[tokio::test]
async fn test_health_check() {
    let helpers::TestApp { address, .. } = helpers::start_app().await;

    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/health_check", address))
        .send()
        .await
        .expect("Failed to execute request");

    assert!(response.status().is_success());
    assert_eq!(response.status(), 200)
}
