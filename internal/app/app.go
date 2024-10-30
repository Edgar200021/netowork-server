package app

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/Edgar200021/netowork-server/internal/config"
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

func New(config *config.Config) (*application, func()) {

	_, pool := storage.New(&config.Database)

	router := http.NewServeMux()

	router.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Hello World")
	})

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
