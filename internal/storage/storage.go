package storage

import (
	"context"
	"fmt"
	"log"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
}

func New(dbConfig *config.DatabaseConfig) (*Store, *pgxpool.Pool) {
	connPool, err := pgxpool.NewWithConfig(context.Background(), dbConfig.ConnectOptions())
	if err != nil {
		log.Fatal("Error while creating connection to the database!!")
	}

	connection, err := connPool.Acquire(context.Background())
	if err != nil {
		log.Fatal("Error while acquiring connection from the database pool!!")
	}
	defer connection.Release()

	err = connection.Ping(context.Background())
	if err != nil {
		log.Fatal("Could not ping database")
	}

	fmt.Println("Connected to the database!!")

	return &Store{}, connPool
}
