package user

import (
	"context"
	"time"

	"github.com/Edgar200021/netowork-server/internal/models"
)

func (s *UserService) GetById(id int) (*models.User, error) {
	ctx, _ := context.WithTimeout(context.Background(), time.Second*4)

	return s.userRepository.GetById(ctx, id)
}
