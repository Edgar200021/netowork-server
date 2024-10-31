package main

import (
	"fmt"
	_ "fmt"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/Edgar200021/netowork-server/internal/app"
	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/joho/godotenv"
)

const (
	ENV_LOCAL      = "local"
	ENV_PRODUCTION = "production"
)

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
}

func main() {
	config := config.New()
	logger := setupLogger()

	sigChannel := make(chan os.Signal, 1)
	signal.Notify(sigChannel, syscall.SIGINT, syscall.SIGTERM)

	app, closeFn := app.New(config, logger)

	go func() {
		<-sigChannel
		fmt.Println("Shutting down server...")
		closeFn()
		os.Exit(0)
	}()

	log.Fatal(app.Run())

}

func setupLogger() *slog.Logger {
	var log *slog.Logger
	env := os.Getenv("ENV")

	switch env {
	case ENV_LOCAL:
		log = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}))
	case ENV_PRODUCTION:
		log = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		}))
	default:
		log = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		}))
	}

	return log

}
