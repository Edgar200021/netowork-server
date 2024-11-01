package storage

import (
	"context"
	"errors"
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/models"
	"github.com/Edgar200021/netowork-server/internal/types"
	"github.com/Edgar200021/netowork-server/internal/utils/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PasswordResetTokenRepository interface {
	GetByToken(ctx context.Context, token string) (*models.PasswordResetToken, error)
	Create(ctx context.Context, userId int, token *types.PasswordResetTokenData) error
	DeleteByToken(ctx context.Context, token string) error
	DeleteAllExpiredTokens(ctx context.Context) error
}

type PgPasswordResetTokenRepository struct {
	pool *pgxpool.Pool
	log  *slog.Logger
}

func NewPasswordResetTokenRepository(pool *pgxpool.Pool, log *slog.Logger) *PgPasswordResetTokenRepository {
	return &PgPasswordResetTokenRepository{
		pool,
		log,
	}
}

func (r *PgPasswordResetTokenRepository) GetByToken(ctx context.Context, token string) (*models.PasswordResetToken, error) {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("getting password reset token from database")

	query := `
        SELECT * FROM password_reset_token
        WHERE token = $1
    `

	var verificationToken models.PasswordResetToken

	if err := r.pool.
		QueryRow(ctx, query, token).
		Scan(&verificationToken.ID, &verificationToken.UserID, &verificationToken.Token, &verificationToken.Expires); err != nil {

		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		r.log.Error("failed to execute query", sl.Err(err))
		return nil, err
	}

	return &verificationToken, nil
}

func (r *PgPasswordResetTokenRepository) Create(ctx context.Context, userId int, token *types.PasswordResetTokenData) error {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("insert new password reset token into database")

	query := `
        INSERT INTO password_reset_token (user_id, token, expires)
        VALUES ($1, $2, $3)
    `

	if _, err := r.pool.Exec(ctx, query, userId, token.Token, token.Expires); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	return nil

}

func (r *PgPasswordResetTokenRepository) DeleteByToken(ctx context.Context, token string) error {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("deleting password reset token from database")

	query := `
        DELETE FROM password_reset_token
        WHERE token = $1
    `

	if _, err := r.pool.Exec(ctx, query, token); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	return nil

}

func (r *PgPasswordResetTokenRepository) DeleteAllExpiredTokens(ctx context.Context) error {
	r.log.Info("deleting expired password reset tokens from database")

	query := `
        DELETE FROM password_reset_token
        WHERE expires < NOW()
    `

	if _, err := r.pool.Exec(ctx, query); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	return nil

}
