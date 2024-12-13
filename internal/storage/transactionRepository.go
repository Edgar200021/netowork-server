package storage

import (
	"context"
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/types"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TransactionRepository interface {
	CreateUserAndVerificationToken(ctx context.Context, newUser *dto.CreateUserRequest, verificationToken *types.VerificationTokenData) error
	UpdateIsVerifiedAndDeleteVerificationToken(ctx context.Context, userId int, isVerified bool, token string) error
	UpdateUserPasswordAndDeletePasswordResetToken(ctx context.Context, userId int, password string, token string) error
}

type PgTransactionRepository struct {
	pool *pgxpool.Pool
	log  *slog.Logger
}

func NewTransactionRepository(pool *pgxpool.Pool, log *slog.Logger) *PgTransactionRepository {
	return &PgTransactionRepository{
		pool,
		log,
	}
}

func (r *PgTransactionRepository) CreateUserAndVerificationToken(ctx context.Context, newUser *dto.CreateUserRequest, verificationToken *types.VerificationTokenData) error {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("insert new user and verification token into database",
		slog.String("email", newUser.Email),
		slog.String("first_name", newUser.FirstName),
		slog.String("last_name", newUser.LastName))

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		r.log.Error("failed to begin transaction", sl.Err(err))
		return err
	}
	defer tx.Rollback(ctx)

	userQuery := `
        INSERT INTO users
        (email, hashed_password, first_name, last_name, role)
        VALUES
        ($1, $2, $3, $4, $5)
        RETURNING id
    `

	var id int

	if err := tx.
		QueryRow(ctx, userQuery, newUser.Email, newUser.Password, newUser.FirstName, newUser.LastName, newUser.Role).
		Scan(&id); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err

	}

	tokenQuery := `
        INSERT INTO verification_token
        (user_id, token, expires)
        VALUES
        ($1, $2, $3)
    `

	if _, err := tx.Exec(ctx, tokenQuery, id, verificationToken.Token, verificationToken.Expires); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		r.log.Error("failed to commit transaction", sl.Err(err))
		return err
	}

	return nil

}

func (r *PgTransactionRepository) UpdateIsVerifiedAndDeleteVerificationToken(ctx context.Context, userId int, isVerified bool, token string) error {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("updating user verification status and deleting verification token from database", slog.Int("user_id", userId), slog.Bool("is_verified", isVerified))

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		r.log.Error("failed to begin transaction", sl.Err(err))
		return err
	}
	defer tx.Rollback(ctx)

	userQuery := `
        UPDATE users
        SET is_verified = $1
        WHERE id = $2
    `
	if _, err := tx.Exec(ctx, userQuery, isVerified, userId); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	tokenQuery := `
        DELETE FROM verification_token
        WHERE token = $1
    `

	if _, err := tx.Exec(ctx, tokenQuery, token); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		r.log.Error("failed to commit transaction", sl.Err(err))
		return err
	}

	return nil
}

func (r *PgTransactionRepository) UpdateUserPasswordAndDeletePasswordResetToken(ctx context.Context, userId int, password string, token string) error {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("updating user password and deleting password reset token from database", slog.Int("user_id", userId))

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		r.log.Error("failed to begin transaction", sl.Err(err))
		return err
	}
	defer tx.Rollback(ctx)

	userQuery := `
        UPDATE users
        SET hashed_password = $1
        WHERE id = $2
    `
	if _, err := tx.Exec(ctx, userQuery, password, userId); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	tokenQuery := `
        DELETE FROM password_reset_token
        WHERE token = $1
    `

	if _, err := tx.Exec(ctx, tokenQuery, token); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		r.log.Error("failed to commit transaction", sl.Err(err))
		return err
	}

	return nil
}
