package app

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/Edgar200021/netowork-server/internal/router"
	"github.com/Edgar200021/netowork-server/internal/service"
	"github.com/Edgar200021/netowork-server/internal/storage"
	"github.com/Edgar200021/netowork-server/internal/utils/sl"
	"github.com/robfig/cron/v3"
)

type application struct {
	server *http.Server
	cron   *cron.Cron
	port   uint
}

func (a *application) Run() error {
	println("Running on port", a.port)

	a.cron.Start()
	return a.server.ListenAndServe()
}

func New(config *config.Config, log *slog.Logger) (*application, func()) {
	storage, pool := storage.New(&config.Database, log)

	services := service.New(storage, &config.Application, &config.Smtp, log)
	router := router.New(services, log)

	server := http.Server{
		Addr:         fmt.Sprintf("%s:%d", config.HTTPServer.Host, config.HTTPServer.Port),
		Handler:      router,
		WriteTimeout: config.HTTPServer.WriteTimeout,
		ReadTimeout:  config.HTTPServer.ReadTimeout,
		IdleTimeout:  config.HTTPServer.IdleTimeout,
	}

	closeFn := func() {
		pool.Close()
		server.Shutdown(context.Background())
	}

	port, _ := strconv.ParseUint(strings.Split(server.Addr, ":")[1], 10, 32)

	cron := cron.New()

	cron.AddFunc("@daily", func() {
		ctx := context.Background()

		if err := storage.UserRepository.DeleteNotVerifiedUsers(ctx); err != nil {
			log.Error("failed to delete not verified users", sl.Err(err))
		}
		if err := storage.PasswordResetTokenRepository.DeleteAllExpiredTokens(ctx); err != nil {
			log.Error("failed to delete expired password reset tokens", sl.Err(err))
		}
	})

	return &application{
		server: &server,
		port:   uint(port),
		cron:   cron,
	}, closeFn
}
