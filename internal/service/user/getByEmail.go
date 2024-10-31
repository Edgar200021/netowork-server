package user

import (
	"context"
	"time"

	"github.com/Edgar200021/netowork-server/internal/models"
)

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	ctx, _ := context.WithTimeout(context.Background(), time.Second*4)

	return s.userRepository.GetByEmail(ctx, email)
}
