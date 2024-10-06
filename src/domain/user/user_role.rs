use crate::{domain::DomainError, error::Result};

#[derive(Debug)]
pub enum UserRole {
    Admin,
    Client,
    Freelancer,
}

impl UserRole {
    pub fn parse(s: &str) -> Result<Self> {
        match s.to_lowercase().trim() {
            "client" => Ok(Self::Client),
            "freelancer" => Ok(Self::Freelancer),
            "admin" => Err(DomainError::InvalidRole(format!(
                "The role 'admin' is not allowed"
            )))?,
            _ => Err(DomainError::InvalidRole(format!(
                "Invalid value, expected one of the values admin, client, executor - got {}",
                s
            )))?,
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

#[cfg(test)]
mod tests {
    use super::UserRole;
    use claim::{assert_err, assert_ok};

    #[test]
    fn a_roles_with_invalid_value_are_rejected() {
        let roles = vec!["manager", "director"];

        for role in roles {
            assert_err!(UserRole::parse(role));
        }
    }

    #[test]
    fn a_role_with_admin_value_is_rejected() {
        let role = "admin";

        assert_err!(UserRole::parse(role));
    }

    #[test]
    fn a_roles_with_valid_values_are_valid() {
        let roles = vec!["client", "freelancer"];

        for role in roles {
            assert_ok!(UserRole::parse(role));
        }
    }
}
