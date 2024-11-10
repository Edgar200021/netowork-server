package auth

import "context"

func (s *AuthService) Logout(ctx context.Context, sessionKey string) error {

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
