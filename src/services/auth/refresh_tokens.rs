use axum::{
    body::Body,
    extract::Request,
    http::{header::SET_COOKIE, HeaderValue, Response},
    middleware::Next,
};
use time::Duration;

use crate::{
    domain::UserRepository, error::Result, jwt_client::JwtClient, middlewares::UserId,
    services::ApplicationLogicError,
};

pub async fn refresh_tokens<R: UserRepository>(
    mut req: Request,
    next: Next,
    jwt_client: &JwtClient,
    user_repo: &R,
    token: &str,
) -> Result<Response<Body>> {
    let token = jwt_client.verify_refresh_jwt(token)?;

    let user = user_repo
        .get_user_by_id(token.sub)
        .await?
        .ok_or(ApplicationLogicError::UserNotFound)?;

    let (access_token, refresh_token) = jwt_client.generate_tokens(user.id)?;

    let access_expires = Duration::minutes(jwt_client.access_exp_in_minutes()).whole_seconds();
    let refresh_expires = Duration::minutes(jwt_client.refresh_exp_in_minutes()).whole_seconds();

    let mut access_cookie = format!(
        "access_token={access_token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={access_expires}",
    );

    let mut refresh_cookie = format!(
	"access_token={refresh_token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={refresh_expires}",
);

    if jwt_client.secure() {
        access_cookie.push_str(";Secure");
        refresh_cookie.push_str(";Secure");
    }

    req.extensions_mut().insert(UserId(user.id));

    let mut response = next.run(req).await;

    response.headers_mut().insert(
        SET_COOKIE,
        HeaderValue::from_str(&access_cookie).or(Err(ApplicationLogicError::SomethingWentWrong))?,
    );

    response.headers_mut().insert(
        SET_COOKIE,
        HeaderValue::from_str(&refresh_cookie)
            .or(Err(ApplicationLogicError::SomethingWentWrong))?,
    );

    return Ok(response);
}
