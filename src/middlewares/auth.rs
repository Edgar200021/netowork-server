use std::sync::Arc;

use axum::{
    extract::{Request, State},
    http::{header::SET_COOKIE, status::StatusCode, HeaderValue},
    middleware::Next,
    response::IntoResponse,
};
use axum_extra::extract::{cookie::Cookie, CookieJar};
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

                    let expires =
                        Duration::minutes(state.jwt_client.access_exp_in_minutes()).whole_seconds();

                    let mut access_cookie = format!(
						"access_token={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={expires}",	
					);

                    if state.jwt_client.secure() {
                        access_cookie.push_str(";Secure");
                    }

                    req.extensions_mut().insert(UserId(user.id));

                    let mut response = next.run(req).await;

                    response.headers_mut().insert(
                        SET_COOKIE,
                        HeaderValue::from_str(&access_cookie)
                            .or(Err(ApplicationLogicError::SomethingWentWrong))?,
                    );

                    return Ok(response);
                } else {
                    let jar = jar
                        .remove(Cookie::from("access_token"))
                        .remove(Cookie::from("refresh_token"));

                    return Ok((StatusCode::NOT_FOUND, jar).into_response());
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
            &state.database.user_repository,
            &refresh_token,
        )
        .await
    }
}
