package user

import (
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/storage"
)

type UserService struct {
	userRepository storage.UserRepository
	log            *slog.Logger
}

func NewUserService(userRepository storage.UserRepository, log *slog.Logger) *UserService {
	return &UserService{
		userRepository,
		log,
	}
}
