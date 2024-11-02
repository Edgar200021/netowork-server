package types

import "time"

type SessionUser struct {
	Id      int
	Expires time.Time
}
