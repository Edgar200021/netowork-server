package auth

import (
	"context"
	"log/slog"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/types"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/Edgar200021/netowork-server/pkg/token"
	"github.com/go-chi/chi/v5/middleware"
	"golang.org/x/crypto/bcrypt"
)

func (s *AuthService) SignUp(ctx context.Context, data *dto.CreateUserRequest) error {
	s.log = s.log.With("request_id", middleware.GetReqID(ctx))

	user, err := s.userRepository.GetByEmail(ctx, data.Email)
	if err != nil {
		return err
	}

	if user != nil {
		s.log.Info("user already exists", slog.String("email", data.Email))
		return ErrUserExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(data.Password), 14)
	if err != nil {
		s.log.Error("failed to hash password", sl.Err(err))
		return err
	}

	data.Password = string(hashedPassword)

	token, err := token.GenerateToken(36)
	if err != nil {
		s.log.Error("failed to generate token", sl.Err(err))
		return err
	}

	tokenExpires := time.Now().Add(s.applicationConfig.VerificationTokenTTL)

	if err := s.transactionRepository.CreateUserAndVerificationToken(ctx, data, &types.VerificationTokenData{
		Token:   token,
		Expires: tokenExpires,
	}); err != nil {
		return err
	}

	if err := s.smtpClient.SendVerifyAccountEmail(data.Email, token); err != nil {
		s.log.Error("failed to send verification email", sl.Err(err))
		return err
	}

	return nil
}
