package auth

import (
	"context"
	"log/slog"

	"github.com/go-chi/chi/v5/middleware"
)

func (s *AuthService) Logout(ctx context.Context, sessionKey string) error {
	s.log = s.log.With(slog.String("request_id", middleware.GetReqID(ctx)))

	val, err := s.redisClient.Get(ctx, sessionKey)
	if err != nil {
		return err
	}

	if val == "" {
		return ErrRedisValueDoesNotExist
	}

	if err := s.redisClient.Del(ctx, sessionKey); err != nil {
		return err
	}

	return nil
}
