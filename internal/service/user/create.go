package user

import (
	"context"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
)

func (s *UserService) Create(data dto.CreateUserRequest) {
	ctx, _ := context.WithTimeout(context.Background(), time.Second*4)

	s.userRepository.Create(ctx, &data)
}
