#[derive(Debug, sqlx::Type)]
pub struct Token {
    pub id: i32,
    pub user_id: i32,
    pub token: String,
    pub expires: time::PrimitiveDateTime,
}
