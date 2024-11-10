package storage

import (
	"context"
	"errors"
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/models"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository interface {
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetById(ctx context.Context, id int) (*models.User, error)
	Create(ctx context.Context, newUser *dto.CreateUserRequest) (int, error)
	UpdateIsVerified(ctx context.Context, id int, isVerified bool) error
	UpdatePassword(ctx context.Context, id int, password string) error
	DeleteNotVerifiedUsers(ctx context.Context) error
}

type PgUserRepository struct {
	pool *pgxpool.Pool
	log  *slog.Logger
}

func NewUserRepository(pool *pgxpool.Pool, log *slog.Logger) *PgUserRepository {
	return &PgUserRepository{
		pool,
		log,
	}
}

func (r *PgUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("getting user by email from database", slog.String("email", email))

	query := `
        SELECT * FROM users
        WHERE email = $1
    `

	var user models.User

	if err := r.pool.
		QueryRow(ctx, query, email).
		Scan(&user.ID, &user.Email, &user.HashedPassword, &user.FirstName, &user.LastName, &user.Role, &user.Avatar, &user.IsVerified, &user.CreatedAt, &user.UpdatedAt); err != nil {

		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		r.log.Error("failed to execute query", sl.Err(err))
		return nil, err
	}

	return &user, nil
}

func (r *PgUserRepository) GetById(ctx context.Context, id int) (*models.User, error) {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("getting user by id from database", slog.Int("id", id))

	query := `
        SELECT * FROM users
        WHERE id = $1
    `

	var user models.User

	if err := r.pool.
		QueryRow(ctx, query, id).
		Scan(&user.ID, &user.Email, &user.HashedPassword, &user.FirstName, &user.LastName, &user.Role, &user.Avatar, &user.IsVerified, &user.CreatedAt, &user.UpdatedAt); err != nil {

		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		r.log.Error("failed to execute query", sl.Err(err))

		return nil, err
	}

	return &user, nil
}

func (r *PgUserRepository) Create(ctx context.Context, newUser *dto.CreateUserRequest) (int, error) {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("insert new user into database",
		slog.String("email", newUser.Email),
		slog.String("first_name", newUser.FirstName),
		slog.String("last_name", newUser.LastName))

	query := `
        INSERT INTO users
        (email, hashed_password, first_name, last_name, role)
        VALUES
        ($1, $2, $3, $4, $5)
        RETURNING id
    `

	var id int

	if err := r.pool.
		QueryRow(ctx, query, newUser.Email, newUser.Password, newUser.FirstName, newUser.LastName, newUser.Role).
		Scan(&id); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return 0, err

	}

	return id, nil
}

func (r *PgUserRepository) UpdateIsVerified(ctx context.Context, id int, isVerified bool) error {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("updating user verification status in database", slog.Int("id", id), slog.Bool("is_verified", isVerified))

	query := `
        UPDATE users
        SET is_verified = $1
        WHERE id = $2
    `

	if _, err := r.pool.Exec(ctx, query, isVerified, id); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	return nil

}

func (r *PgUserRepository) UpdatePassword(ctx context.Context, id int, password string) error {
	r.log = r.log.With(slog.String("request_id", middleware.GetReqID(ctx)))
	r.log.Info("updating user password in database", slog.Int("id", id))

	query := `
        UPDATE users
        SET hashed_password = $1
        WHERE id = $2
    `

	if _, err := r.pool.Exec(ctx, query, password, id); err != nil {
		r.log.Error("failed to execute query", sl.Err(err))
		return err
	}

	return nil

}

func (r *PgUserRepository) DeleteNotVerifiedUsers(ctx context.Context) error {

	r.log.Info("deleting not verified users from database")

	query := `
        DELETE FROM users 
        WHERE is_verified = false AND created_at < NOW() - INTERVAL '1 day'
    `

	if _, err := r.pool.Exec(ctx, query); err != nil {
		return err
	}

	return nil
}
