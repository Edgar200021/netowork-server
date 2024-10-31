package dto

import "time"

type VerificationTokenData struct {
	Token   string
	Expires time.Time
}
