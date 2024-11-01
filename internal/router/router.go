package router

import (
	"log/slog"

	handlers "github.com/Edgar200021/netowork-server/internal/handlers/auth"
	"github.com/Edgar200021/netowork-server/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func New(services *service.Services, log *slog.Logger) *chi.Mux {
	router := chi.NewRouter()

	apiRouter := chi.NewRouter()

	router.Use(middleware.Logger)
	router.Use(middleware.URLFormat)
	router.Use(middleware.RequestID)
	router.Use(middleware.Recoverer)
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowCredentials: true,
	}))

	router.Mount("/api", apiRouter)

	authHandler := handlers.NewAuthHandler(services.AuthService, log)

	apiRouter.Route("/auth", func(r chi.Router) {
		r.Post("/sign-up", authHandler.SignUp)
		r.Post("/sign-in", authHandler.SignIn)
	})

	return router

}
