package middlewares

import (
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/Edgar200021/netowork-server/internal/redis"
	"github.com/Edgar200021/netowork-server/internal/storage"
)

const (
	CtxUserKey = "user"
)

type Middleware struct {
	applicationConfig *config.ApplicationConfig
	userRepository    storage.UserRepository
	redisClient       *redis.RedisClient
	log               *slog.Logger
}

func New(applicationConfig *config.ApplicationConfig, userRepository storage.UserRepository, redisClient *redis.RedisClient, log *slog.Logger) *Middleware {
	return &Middleware{
		applicationConfig,
		userRepository,
		redisClient,
		log,
	}
}
