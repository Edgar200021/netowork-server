package auth

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
	"golang.org/x/crypto/bcrypt"
)

func (s *AuthService) ResetPassword(ctx context.Context, data *dto.ResetPasswordRequest) error {
	s.log = s.log.With(slog.String("request_id", middleware.GetReqID(ctx)))

	token, err := s.passwordResetTokenRepository.GetByToken(ctx, data.Token)
	if err != nil {
		return err
	}

	if token == nil {
		return ErrPasswordResetTokenDoesNotExist
	}

	fmt.Println("TOKEN EXPIRES", token.Expires.UTC())
    fmt.Println("NOW", time.Now().UTC())

	if time.Now().UTC().After(token.Expires) {
		return ErrPasswordResetTokenExpired
	}

	user, err := s.userRepository.GetById(ctx, token.UserID)
	if err != nil {
		return err
	}

	if user == nil {
		return ErrUserDoesNotExist
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(data.Password), 14)
	if err != nil {
		s.log.Error("failed to hash password", sl.Err(err))
		return err
	}

	data.Password = string(hashedPassword)

	if err := s.transactionRepository.UpdateUserPasswordAndDeletePasswordResetToken(ctx, user.ID, data.Password, token.Token); err != nil {
		return err
	}

	return nil
}
