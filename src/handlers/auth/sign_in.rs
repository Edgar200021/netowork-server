use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{debug_handler, Json};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use time::Duration;
use validator::Validate;

use crate::app::AppState;
use crate::dto::SignInRequest;
use crate::error::Result;
use crate::helpers::{send_json, Status};
use crate::services::{self};

#[debug_handler]
#[tracing::instrument(
	name = "Sign in", 
	skip(state, data),
	 fields(
		user_email = %data.email
	 ))]
pub async fn sign_in(
    State(state): State<Arc<AppState>>,
    jar: CookieJar,
    Json(data): Json<SignInRequest>,
) -> Result<impl IntoResponse> {
    data.validate()?;

    let mut redis_client = state.redis_client.write().await;

    let (user, access_token, refresh_token) = services::sign_in(
        data,
        &state.database.user_repository,
        &state.jwt_client,
        &mut redis_client,
    )
    .await?;

    let access_cookie = Cookie::build(("access_token", access_token))
        .http_only(true)
        .path("/")
        .secure(state.jwt_client.secure())
        .max_age(Duration::minutes(state.jwt_client.access_exp_in_minutes()))
        .same_site(SameSite::Strict);

    let refresh_cookie = Cookie::build(("refresh_token", refresh_token))
        .http_only(true)
        .path("/")
        .secure(state.jwt_client.secure())
        .max_age(Duration::minutes(state.jwt_client.refresh_exp_in_minutes()))
        .same_site(SameSite::Strict);

    let jar = jar.add(access_cookie).add(refresh_cookie);

    Ok((StatusCode::OK, jar, send_json(Status::Success, user)))
}
