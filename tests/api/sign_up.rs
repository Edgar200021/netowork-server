use netowork::domain::UserRepository;
use serde_json::json;

use crate::helpers::TestApp;

#[tokio::test]
pub async fn sign_up_with_missing_data_fields_returns_422() {
    let test_app = TestApp::build().await;

    let body = json!({
        "email": "johndoe@me.com",
        "password": "password",
        "first_name": "John",
        "last_name": "Doe",
    });

    let response = test_app.post_sign_up(body.to_string()).await;

    assert_eq!(422, response.status());
}

#[tokio::test]
pub async fn sign_up_with_invalid_data_returns_400() {
    let test_app = TestApp::build().await;

    let test_cases = vec![
        json!({
            "email": "johndoe",
            "password": "password",
            "password_confirm": "password",
            "first_name": "John",
            "last_name": "Doe",
            "role": "freelancer"
        }),
        json!({
            "email": "johndoe@gmail.com",
            "password": "password123",
            "password_confirm": "password",
            "first_name": "John",
            "last_name": "Doe",
            "role": "freelancer"
        }),
        json!({
            "email": "johndoe@gmail.com",
            "password": "password",
            "password_confirm": "password",
            "first_name": "John<>",
            "last_name": "Doe",
            "role": "freelancer"
        }),
        json!({
            "email": "johndoe@gmail.com",
            "password": "passwd1",
            "password_confirm": "passwd1",
            "first_name": "John",
            "last_name": "Doe",
            "role": "freelancer"
        }),
        json!({
            "email": "johndoe@gmail.com",
            "password": "password",
            "password_confirm": "password",
            "first_name": "John",
            "last_name": "Doe//",
            "role": "freelancer"
        }),
        json!({
            "email": "johndoe@gmail.com",
            "password": "password",
            "password_confirm": "password",
            "first_name": "John",
            "last_name": "Doe",
            "role": "admin"
        }),
    ];

    for case in test_cases {
        let response = test_app.post_sign_up(case.to_string()).await;

        assert_eq!(400, response.status())
    }
}

#[tokio::test]
pub async fn sign_up_with_valid_data_returns_200() {
    let test_app = TestApp::build().await;

    let body = json!({
        "email": "johndoe@gmail.com",
        "password": "password",
        "password_confirm": "password",
        "first_name": "John",
        "last_name": "Doe",
        "role": "freelancer"
    });

    let response = test_app.post_sign_up(body.to_string()).await;

    println!("{response:?}");

    assert_eq!(200, response.status());
    assert_eq!(Some(0), response.content_length());
}

#[tokio::test]
pub async fn sign_up_persists_the_new_user() {
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
    let saved = test_app
        .db
        .user_repository
        .get_by_email("johndoe@gmail.com")
        .await
        .expect("Failed to execute query")
        .expect("User not found");

    assert_eq!(saved.email, "johndoe@gmail.com");
    assert_eq!(saved.first_name, "John");
    assert_eq!(saved.role.as_ref(), "freelancer");
}
