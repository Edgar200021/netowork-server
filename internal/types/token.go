package types

import "time"

type VerificationTokenData struct {
	Token   string
	Expires time.Time
}

type PasswordResetTokenData struct {
	Token   string
	Expires time.Time
}
