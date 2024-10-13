//use jsonwebtoken::{encode, EncodingKey, Header};
//use secrecy::{ExposeSecret, SecretString};
//use serde::{Deserialize, Serialize};

//use crate::{domain::UserID, error::Result, services::ApplicationLogicError};

//#[derive(Deserialize, Serialize)]
//pub struct Claims<T> {
//    pub sub: T,
//    pub exp: usize,
//}

//pub fn generate_token(
//    user_id: i32,
//    exp_in_minutes: usize,
//    secret: &SecretString,
//) -> Result<String> {
//    let claims = Claims {
//        sub: user_id,
//        exp: (time::Utc::now() + time::Duration::minutes(exp_in_minutes as i64)).timestamp()
//            as usize,
//    };

//    let token = encode(
//        &Header::default(),
//        &claims,
//        &EncodingKey::from_secret(secret.expose_secret().as_ref()),
//    )
//    .map_err(|e| ApplicationLogicError::JwtError(e))?;

//    Ok(token)
//}
