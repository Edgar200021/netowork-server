use crate::domain::DomainError;

#[derive(Debug)]
pub enum UserRole {
    Admin,
    Client,
    Freelancer,
}

impl UserRole {
    pub fn parse(s: &str) -> Result<Self, DomainError> {
        match s.to_lowercase().trim() {
            "client" => Ok(Self::Client),
            "freelancer" => Ok(Self::Freelancer),
            "admin" => Err(DomainError::InvalidRoleError(format!(
                "The role 'admin' is not allowed"
            ))),
            _ => Err(DomainError::InvalidRoleError(format!(
                "Invalid value, expected one of the values admin, client, executor - got {}",
                s
            ))),
        }
    }
}

impl AsRef<str> for UserRole {
    fn as_ref(&self) -> &str {
        match self {
            Self::Admin => "admin",
            Self::Client => "client",
            Self::Freelancer => "freelancer",
        }
    }
}
