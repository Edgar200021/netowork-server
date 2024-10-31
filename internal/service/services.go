package service

import (
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/internal/service/sender"
	"github.com/Edgar200021/netowork-server/internal/service/user"
	"github.com/Edgar200021/netowork-server/internal/storage"
)

type Services struct {
	AuthService *auth.AuthService
	UserService *user.UserService
}

func New(store *storage.Store, applicationConfig *config.ApplicationConfig, smtpConfig *config.SmtpConfig, log *slog.Logger) *Services {

	var (
		smtpService = sender.New(smtpConfig, applicationConfig)
		authService = auth.NewAuthService(store.UserRepository, store.TransactionRepository, log, applicationConfig, smtpService)
		userService = user.NewUserService(store.UserRepository, log)
	)

	return &Services{
		AuthService: authService,
		UserService: userService,
	}
}
