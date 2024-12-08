package auth

import (
	"context"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/models"
	"github.com/go-chi/chi/v5/middleware"
)

func (s *AuthService) VerifyAccount(ctx context.Context, data *dto.VerifyAccountRequest) (*models.User, string, error) {

	s.log = s.log.With("request_id", middleware.GetReqID(ctx))

	token, err := s.verificationTokenRepository.GetByToken(ctx, data.Token)
	if err != nil {
		return nil, "", err
	}

	if token == nil {
		s.log.Error("verification token not found")
		return nil, "", ErrVerificationTokenDoesNotExist
	}

	if time.Now().UTC().After(token.Expires) {
		s.log.Error("verification token expired")

		if err := s.verificationTokenRepository.DeleteByToken(ctx, data.Token); err != nil {
			return nil, "", err
		}

		return nil, "", ErrVerificationTokenExpired
	}

	user, err := s.userRepository.GetById(ctx, token.UserID)
	if err != nil {
		return nil, "", err
	}

	if user == nil {
		s.log.Error("user not found")
		return nil, "", ErrUserDoesNotExist
	}

	if err := s.transactionRepository.UpdateIsVerifiedAndDeleteVerificationToken(ctx, token.UserID, true, token.Token); err != nil {
		return nil, "", err
	}

	sessionKey, err := StoreUserSession(ctx, s.applicationConfig, s.redisClient, user)
	if err != nil {
		return nil, "", err
	}

	return user, sessionKey, nil

}
