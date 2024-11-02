package router

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/Edgar200021/netowork-server/internal/config"
	handlers "github.com/Edgar200021/netowork-server/internal/handlers/auth"
	"github.com/Edgar200021/netowork-server/internal/middlewares"
	"github.com/Edgar200021/netowork-server/internal/models"
	"github.com/Edgar200021/netowork-server/internal/service"
	"github.com/Edgar200021/netowork-server/internal/utils/response"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
)

func New(m *middlewares.Middleware, applicationConfig *config.ApplicationConfig, services *service.Services, log *slog.Logger) *chi.Mux {
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

	authHandler := handlers.NewAuthHandler(services.AuthService, log, applicationConfig)

	apiRouter.Route("/auth", func(r chi.Router) {
		r.Use(httprate.LimitByIP(50, time.Hour*24))
		r.Post("/sign-up", authHandler.SignUp)
		r.Post("/forgot-password", authHandler.ForgotPassword)
		r.Post("/sign-in", authHandler.SignIn)
		r.Patch("/account-verification", authHandler.VerifyAccount)
	})

	apiRouter.Route("/user", func(r chi.Router) {
		r.Use(m.Auth)
		r.Get("/hello", func(w http.ResponseWriter, r *http.Request) {
			user := r.Context().Value(middlewares.CtxUserKey).(*models.User)

			if user == nil {
				response.UnauthorizedResponse(w)
				return
			}

			fmt.Println(user)

			w.Write([]byte("hello"))
		})

		r.Get("/protected", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("protected"))
		})
	})

	return router

}
