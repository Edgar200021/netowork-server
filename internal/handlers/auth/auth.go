package handlers

import (
	"log/slog"

	service "github.com/Edgar200021/netowork-server/internal/service/auth"
)

type authHandler struct {
	authService *service.AuthService
	log         *slog.Logger
}

func NewAuthHandler(authService *service.AuthService, log *slog.Logger) *authHandler {
	return &authHandler{
		authService,
		log,
	}
}
