use reqwest::header::SET_COOKIE;
use serde_json::json;

use crate::helpers::TestApp;

#[tokio::test]
pub async fn sign_in_with_missing_data_fields_returns_422() {
    let test_app = TestApp::build().await;

    let body = json!({
        "email": "johndoe@me.com",
    });

    let response = test_app.post_sign_in(body.to_string()).await;

    assert_eq!(422, response.status());
}

#[tokio::test]
pub async fn sign_in_with_invalid_data_returns_400() {
    let test_app = TestApp::build().await;

    let test_cases = vec![
        json!({
            "email": "johndoe",
            "password": "password"
        }),
        json!({
            "email": "johndoe@gmail.com",
            "password": "passwor",
        }),
    ];

    for case in test_cases {
        let response = test_app.post_sign_in(case.to_string()).await;

        assert_eq!(400, response.status())
    }
}

#[tokio::test]
pub async fn sign_in_with_valid_data_returns_200() {
    let test_app = TestApp::build().await;

    let body = json!({
        "email": "johndoe@gmail.com",
        "password": "password",
        "password_confirm": "password",
        "first_name": "John",
        "last_name": "Doe",
        "role": "freelancer"
    });

    test_app.post_sign_up(body.to_string()).await;
    let response = test_app
        .post_sign_in(
            json!({
                "email": "johndoe@gmail.com",
                "password": "password"
            })
            .to_string(),
        )
        .await;

    assert_eq!(response.status(), 200);
    assert_eq!(response.content_length(), Some(0));
}

#[tokio::test]
pub async fn sing_in_attaches_tokens_to_cookie() {
    let test_app = TestApp::build().await;

    let body = json!({
        "email": "johndoe@gmail.com",
        "password": "password",
        "password_confirm": "password",
        "first_name": "John",
        "last_name": "Doe",
        "role": "freelancer"
    });

    test_app.post_sign_up(body.to_string()).await;
    let response = test_app
        .post_sign_in(
            json!({
                "email": "johndoe@gmail.com",
                "password": "password"
            })
            .to_string(),
        )
        .await;

    let cookie_keys = ["access_token", "refresh_token"];

    response.headers().get_all(SET_COOKIE).iter().for_each(|v| {
        let (key, value) = v.to_str().unwrap().split_once("=").expect("Invalid cookie");
        assert!(cookie_keys.contains(&key));
        assert!(value.contains("HttpOnly"));
    });
}
