package models

import "time"

type PasswordResetToken struct {
	ID      int       `db:"id"`
	UserID  int       `db:"user_id"`
	Token   string    `db:"token"`
	Expires time.Time `db:"expires"`
}
