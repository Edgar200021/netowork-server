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
	Email          string    `db:"email"`
	HashedPassword string    `db:"hashed_password" json:"-"`
	FirstName      string    `db:"first_name"`
	LastName       string    `db:"last_name"`
	Role           UserRole  `db:"role"`
	IsVerified     bool      `db:"is_verified" json:"-"`
	CreatedAt      time.Time `db:"created_at"  json:"-"`
	UpdatedAt      time.Time `db:"updated_at"  json:"-"`
}
