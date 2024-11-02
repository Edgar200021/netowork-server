package auth

import (
	"context"
	"log/slog"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/types"
	"github.com/Edgar200021/netowork-server/internal/utils/token"
	"github.com/go-chi/chi/v5/middleware"
)

func (s *AuthService) ForgotPassword(ctx context.Context, data dto.ForgotPasswordRequest) error {

	s.log = s.log.With(slog.String("request_id", middleware.GetReqID(ctx)))

	user, err := s.userRepository.GetByEmail(ctx, data.Email)
	if err != nil {
		return err
	}

	if user == nil {
		s.log.Error("user does not exist")
		return ErrUserDoesNotExist
	}

	token, err := token.GenerateToken(36)
	if err != nil {
		return err
	}

	tokenExpires := time.Now().Add(s.applicationConfig.PasswordResetTokenTTL)

	if err := s.passwordResetTokenRepository.Create(ctx, user.ID, &types.PasswordResetTokenData{
		Token:   token,
		Expires: tokenExpires,
	}); err != nil {
		return err
	}

	if err := s.smtpClient.SendResetPasswordEmail(user.Email, token); err != nil {
		return err
	}

	return nil

}
