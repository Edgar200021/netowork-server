package dto

type CreateUserRequest struct {
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8,max=64"`
	PasswordConfirm string `json:"password_confirm" validate:"required,eqfield=Password"`
	FirstName       string `json:"first_name" validate:"required,excludesall=!/{}[]"`
	LastName        string `json:"last_name" validate:"required,excludesall=!/{}[]"`
	Role            string `json:"role" validate:"required,oneof=freelancer client"`
}

