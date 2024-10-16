use axum::{body::Body, extract::Request, http::Response, middleware::Next};
use axum_extra::extract::{
    cookie::{Cookie, SameSite},
    CookieJar,
};
use time::Duration;

use crate::{
    domain::UserRepository, error::Result, jwt_client::JwtClient, middlewares::UserId,
    redis_client::RedisClient, services::ApplicationLogicError,
};

pub async fn refresh_tokens<R: UserRepository>(
    mut req: Request,
    next: Next,
    jwt_client: &JwtClient,
    redis_client: &mut RedisClient,
    jar: CookieJar,
    user_repo: &R,
    token: &str,
) -> Result<(CookieJar, Response<Body>)> {
    let token = jwt_client.verify_refresh_jwt(token)?;

    let user = user_repo
        .get_by_id(token.sub)
        .await?
        .ok_or(ApplicationLogicError::UserNotFound)?;

    let redis_token = redis_client
        .get::<String, String>(user.id.to_string())
        .await?
        .ok_or(ApplicationLogicError::InvalidCredentials)?;

    if token.refresh_token_id.to_string() != redis_token {
        redis_client.delete(user.id.to_string()).await?;
        return Err(ApplicationLogicError::InvalidCredentials)?;
    }

    let (access_token, refresh_token, refresh_token_id) = jwt_client.generate_tokens(user.id)?;

    redis_client
        .insert(user.id.to_string(), refresh_token_id.to_string())
        .await?;

    req.extensions_mut().insert(UserId(user.id));

    let response = next.run(req).await;

    let access_cookie = Cookie::build(("access_token", access_token))
        .http_only(true)
        .path("/")
        .secure(jwt_client.secure())
        .max_age(Duration::minutes(jwt_client.access_exp_in_minutes()))
        .same_site(SameSite::Strict);

    let refresh_cookie = Cookie::build(("refresh_token", refresh_token))
        .http_only(true)
        .path("/")
        .secure(jwt_client.secure())
        .max_age(Duration::minutes(jwt_client.refresh_exp_in_minutes()))
        .same_site(SameSite::Strict);

    let jar = jar.add(access_cookie).add(refresh_cookie);

    return Ok((jar, response));
}
