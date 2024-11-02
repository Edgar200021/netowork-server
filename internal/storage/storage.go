package storage

import (
	"context"
	"fmt"
	"log"
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	UserRepository               UserRepository
	TransactionRepository        TransactionRepository
	VerificationTokenRepository  VerificationTokenRepository
	PasswordResetTokenRepository PasswordResetTokenRepository
	pool                         *pgxpool.Pool
}

func New(dbConfig *config.DatabaseConfig, slog *slog.Logger) *Store {
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

	return &Store{
		UserRepository:               NewUserRepository(connPool, slog),
		TransactionRepository:        NewTransactionRepository(connPool, slog),
		VerificationTokenRepository:  NewVerificationTokenRepository(connPool, slog),
		PasswordResetTokenRepository: NewPasswordResetTokenRepository(connPool, slog),
		pool:                         connPool,
	}
}

func (s *Store) Close() {
	s.pool.Close()
}
