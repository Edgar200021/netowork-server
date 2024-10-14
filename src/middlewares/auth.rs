use std::sync::Arc;

use axum::{
    extract::{Request, State},
    middleware::Next,
    response::IntoResponse,
};
use axum_extra::extract::{
    cookie::{Cookie, SameSite},
    CookieJar,
};
use jsonwebtoken::errors::ErrorKind;
use time::Duration;

use crate::{
    app::AppState,
    domain::UserRepository,
    error::{AppError, Result},
    services::{refresh_tokens, ApplicationLogicError},
};

#[derive(Clone)]
pub struct UserId(pub i32);

#[tracing::instrument(name = "Verify jwt tokens", skip(state, jar, req, next))]
pub async fn auth(
    State(state): State<Arc<AppState>>,
    jar: CookieJar,
    mut req: Request,
    next: Next,
) -> Result<impl IntoResponse> {
    if let Some(token) = jar.get("access_token") {
        let token = token.value();

        match state.jwt_client.verify_access_jwt(token) {
            Ok(claim) => {
                let user = state
                    .database
                    .user_repository
                    .get_user_by_id(claim.sub)
                    .await?;

                if let Some(user) = user {
                    let token = state.jwt_client.generate_access_jwt(user.id)?;

                    let access_cookie = Cookie::build(("access_token", token))
                        .http_only(true)
                        .path("/")
                        .secure(state.jwt_client.secure())
                        .max_age(Duration::minutes(state.jwt_client.access_exp_in_minutes()))
                        .same_site(SameSite::Strict);

                    let jar = jar.add(access_cookie);

                    req.extensions_mut().insert(UserId(user.id));

                    let response = next.run(req).await;

                    return Ok((jar, response));
                } else {
                    return Err(ApplicationLogicError::UserNotFound)?;
                }
            }
            Err(err) => match err {
                AppError::ApplicationLogicError(ApplicationLogicError::JwtError(err)) => {
                    if let ErrorKind::ExpiredSignature = err.kind() {
                        let refresh_token = jar
                            .get("refresh_token")
                            .ok_or(ApplicationLogicError::Unauthorized)?
                            .value();

                        return refresh_tokens(
                            req,
                            next,
                            &state.jwt_client,
                            jar.clone(),
                            &state.database.user_repository,
                            &refresh_token,
                        )
                        .await;
                    }
                    return Err(ApplicationLogicError::Unauthorized)?;
                }
                _ => return Err(ApplicationLogicError::Unauthorized)?,
            },
        }
    } else {
        let refresh_token = jar
            .get("refresh_token")
            .ok_or(ApplicationLogicError::Unauthorized)?
            .value();

        refresh_tokens(
            req,
            next,
            &state.jwt_client,
            jar.clone(),
            &state.database.user_repository,
            &refresh_token,
        )
        .await
    }
}
