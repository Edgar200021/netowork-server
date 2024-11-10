package models

import "time"

type UserRole string

const (
	Admin      UserRole = "admin"
	Client     UserRole = "client"
	Freelancer UserRole = "Freelancer"
)

type User struct {
	ID             int       `db:"id" json:"-"`
	Email          string    `db:"email" json:"email"`
	HashedPassword string    `db:"hashed_password" json:"-"`
	FirstName      string    `db:"first_name" json:"first_name"`
	LastName       string    `db:"last_name" json:"last_name"`
	Role           UserRole  `db:"role" json:"role"`
	Avatar         *string    `db:"avatar" json:"avatar"`
	IsVerified     bool      `db:"is_verified" json:"-"`
	CreatedAt      time.Time `db:"created_at"  json:"-"`
	UpdatedAt      time.Time `db:"updated_at"  json:"-"`
}
