package storage

import (
	"context"
	"errors"
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/models"
	"github.com/Edgar200021/netowork-server/internal/utils/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type VerificationTokenRepository interface {
	GetByToken(ctx context.Context, token string) (*models.VerificationToken, error)
}

type PgVerificationTokenRepository struct {
	pool *pgxpool.Pool
	log  *slog.Logger
}

func NewVerificationTokenRepository(pool *pgxpool.Pool, log *slog.Logger) *PgVerificationTokenRepository {
	return &PgVerificationTokenRepository{
		pool,
		log,
	}
}

func (r *PgVerificationTokenRepository) GetByToken(ctx context.Context, token string) (*models.VerificationToken, error) {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("getting token from database")

	query := `
        SELECT * FROM verification_token
        WHERE token = $1
    `

	var verificationToken models.VerificationToken

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
