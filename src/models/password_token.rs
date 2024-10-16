#[derive(Debug, sqlx::Type)]
pub struct PasswordToken {
    pub id: i32,
    pub user_id: i32,
    pub token: String,
    pub expires: time::PrimitiveDateTime,
}
