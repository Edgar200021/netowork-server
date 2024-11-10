package handlers

import (
	"log/slog"
	"time"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/Edgar200021/netowork-server/internal/middlewares"
	service "github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/httprate"
)

type authHandler struct {
	authService       *service.AuthService
	log               *slog.Logger
	applicationConfig *config.ApplicationConfig
}

func NewAuthHandler(router *chi.Mux, middlewares *middlewares.Middleware, authService *service.AuthService, log *slog.Logger, applicationConfig *config.ApplicationConfig) {

	handler := &authHandler{
		authService,
		log,
		applicationConfig,
	}

	router.Route("/auth", func(r chi.Router) {
		r.Use(httprate.LimitByIP(50, time.Hour*24))
		r.Post("/sign-up", handler.SignUp)
		r.Post("/forgot-password", handler.ForgotPassword)
		r.Post("/sign-in", handler.SignIn)
		r.Patch("/account-verification", handler.VerifyAccount)
		r.Post("/logout", middlewares.Auth(handler.Logout))
	})

}
