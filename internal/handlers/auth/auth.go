package handlers

import (
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/config"
	service "github.com/Edgar200021/netowork-server/internal/service/auth"
)

const (
	UserSessionCookieName = "user_session"
)

type authHandler struct {
	authService       *service.AuthService
	log               *slog.Logger
	applicationConfig *config.ApplicationConfig
}

func NewAuthHandler(authService *service.AuthService, log *slog.Logger, applicationConfig *config.ApplicationConfig) *authHandler {
	return &authHandler{
		authService,
		log,
		applicationConfig,
	}
}
