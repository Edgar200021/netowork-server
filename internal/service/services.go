package service

import (
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/Edgar200021/netowork-server/internal/redis"
	"github.com/Edgar200021/netowork-server/internal/sender"
	"github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/internal/service/user"
	"github.com/Edgar200021/netowork-server/internal/storage"
)

type Services struct {
	AuthService *auth.AuthService
	UserService *user.UserService
}

func New(store *storage.Store, applicationConfig *config.ApplicationConfig, log *slog.Logger, sender sender.Sender, redisClient *redis.RedisClient) *Services {

	var (
		authService = auth.NewAuthService(store.UserRepository, store.VerificationTokenRepository, store.PasswordResetTokenRepository, store.TransactionRepository, log, applicationConfig, sender, redisClient)
		userService = user.NewUserService(store.UserRepository, log)
	)

	return &Services{
		AuthService: authService,
		UserService: userService,
	}
}
