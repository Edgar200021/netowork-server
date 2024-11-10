package router

import (
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/config"
	handlers "github.com/Edgar200021/netowork-server/internal/handlers/auth"
	"github.com/Edgar200021/netowork-server/internal/middlewares"
	"github.com/Edgar200021/netowork-server/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func New(m *middlewares.Middleware, applicationConfig *config.ApplicationConfig, services *service.Services, log *slog.Logger) *chi.Mux {
	router := chi.NewRouter()

	apiRouter := chi.NewRouter()

	router.Use(middleware.Logger)
	router.Use(middleware.URLFormat)
	router.Use(middleware.RequestID)
	router.Use(middleware.Recoverer)
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{applicationConfig.ClientURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowCredentials: true,
	}))

	router.Mount("/api", apiRouter)

	handlers.NewAuthHandler(apiRouter, m, services.AuthService, log, applicationConfig)

	return router

}
