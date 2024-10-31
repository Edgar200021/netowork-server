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
)

type application struct {
	server *http.Server
	port   uint
}

func (a *application) Run() error {

	println("Running on port", a.port)

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

	return &application{
		server: &server,
		port:   uint(port),
	}, closeFn
}
