package main

import (
	"fmt"
	_ "fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/Edgar200021/netowork-server/internal/app"
	"github.com/Edgar200021/netowork-server/internal/config"

	//"github.com/Edgar200021/netowork-server/internal/storage"
	"github.com/joho/godotenv"
)

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
}

func main() {
	config := config.New()

	sigChannel := make(chan os.Signal, 1)
	signal.Notify(sigChannel, syscall.SIGINT, syscall.SIGTERM)

	app, closeFn := app.New(config)

	go func() {
		<-sigChannel
		fmt.Println("Shutting down server...")
		closeFn()
		os.Exit(0)
	}()

	log.Fatal(app.Run())

}
