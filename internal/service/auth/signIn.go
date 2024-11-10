package auth

import (
	"context"
	"time"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/models"
	"github.com/Edgar200021/netowork-server/internal/redis"
	"github.com/Edgar200021/netowork-server/internal/types"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func (s *AuthService) SignIn(ctx context.Context, data *dto.SignInRequest) (*models.User, string, error) {
	s.log = s.log.With("request_id", middleware.GetReqID(ctx))

	user, err := s.userRepository.GetByEmail(ctx, data.Email)
	if err != nil {
		s.log.Error("failed to get user by email", sl.Err(err))
		return nil, "", err
	}

	if user == nil {
		s.log.Error("user does not exist")
		return nil, "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.HashedPassword), []byte(data.Password)); err != nil {
		s.log.Error("failed to compare password", sl.Err(err))
		return nil, "", ErrInvalidCredentials
	}

	if !user.IsVerified {
		s.log.Error("user is not verified")
		return nil, "", ErrAccountNotVerified
	}

	sessionKey, err := StoreUserSession(ctx, s.applicationConfig, s.redisClient, user)
	if err != nil {
		return nil, "", err
	}

	return user, sessionKey, nil
}

func StoreUserSession(ctx context.Context, applicationConfig *config.ApplicationConfig, redisClient *redis.RedisClient, user *models.User) (string, error) {

	sessionKey := uuid.New().String()
	expires := time.Now().Add(applicationConfig.UserSessionTTL).UTC()

	if err := redisClient.Set(ctx, sessionKey, types.SessionUser{
		Id:      user.ID,
		Expires: expires,
	}, applicationConfig.UserSessionTTL+time.Hour*24); err != nil {
		return "", err
	}

	return sessionKey, nil
}
