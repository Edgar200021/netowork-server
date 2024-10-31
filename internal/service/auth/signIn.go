package auth

import (
	"context"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/models"
	"github.com/Edgar200021/netowork-server/internal/utils/sl"
	"github.com/go-chi/chi/v5/middleware"
	"golang.org/x/crypto/bcrypt"
)

func (s *AuthService) SignIn(ctx context.Context, data dto.SignInRequest) (*models.User, error) {
	s.log = s.log.With("request_id", middleware.GetReqID(ctx))

	user, err := s.userRepository.GetByEmail(ctx, data.Email)
	if err != nil {
		s.log.Error("failed to get user by email", sl.Err(err))
		return nil, err
	}

	if user == nil {
		s.log.Error("user does not exist", sl.Err(err))
		return nil, ErrUserDoesNotExist
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.HashedPassword), []byte(data.Password)); err != nil {
		s.log.Error("failed to compare password", sl.Err(err))
		return nil, ErrInvalidCredentials
	}

	if !user.IsVerified {
		s.log.Error("user is not verified", sl.Err(err))
		return nil, ErrAccountNotVerified
	}

	return user, nil
}
