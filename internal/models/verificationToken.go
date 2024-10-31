package models

import "time"

type VerificationToken struct {
	ID      int       `db:"id"`
	UserID  int       `db:"user_id"`
	Token   string    `db:"token"`
	Expires time.Time `db:"expires"`
}
