package dto

type SignInRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=64"`
}

type VerifyAccountRequest struct {
	Token string `json:"token" validate:"required,min=1"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token           string `json:"token" validate:"required,min=1"`
	Password        string `json:"password" validate:"required,min=8,max=64"`
	PasswordConfirm string `json:"password_confirm" validate:"required,eqfield=Password"`
}
