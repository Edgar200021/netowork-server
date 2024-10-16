use std::sync::Arc;

use axum::{
    extract::{Request, State},
    middleware::Next,
    response::IntoResponse,
};
use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::errors::ErrorKind;
use time::OffsetDateTime;

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
    jar: CookieJar,
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<impl IntoResponse> {
    let mut redis_client = state.redis_client.write().await;

    if let Some(token) = jar.get("access_token") {
        let token = token.value();

        match state.jwt_client.verify_access_jwt(token) {
            Ok(claim) => {
                let user = state
                    .database
                    .user_repository
                    .get_by_id(claim.sub)
                    .await?
                    .ok_or(ApplicationLogicError::UserNotFound)?;

                println!(
                    "{}",
                    OffsetDateTime::now_utc().unix_timestamp()
                        - OffsetDateTime::from_unix_timestamp(claim.exp)
                            .unwrap()
                            .unix_timestamp()
                );

                req.extensions_mut().insert(UserId(user.id));

                let response = next.run(req).await;

                return Ok((jar, response));
            }
            Err(err) => {
                if let AppError::ApplicationLogicError(ApplicationLogicError::JwtError(err)) = err {
                    if let ErrorKind::ExpiredSignature = err.kind() {
                        let refresh_token = jar
                            .get("refresh_token")
                            .ok_or(ApplicationLogicError::Unauthorized)?
                            .value();

                        return refresh_tokens(
                            req,
                            next,
                            &state.jwt_client,
                            &mut redis_client,
                            jar.clone(),
                            &state.database.user_repository,
                            &refresh_token,
                        )
                        .await;
                    }

                    return Err(ApplicationLogicError::JwtError(err))?;
                }

                return Err(ApplicationLogicError::Unauthorized)?;
            }
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
            &mut redis_client,
            jar.clone(),
            &state.database.user_repository,
            &refresh_token,
        )
        .await
    }
}
