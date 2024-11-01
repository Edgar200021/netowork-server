package auth

import (
	"errors"
	"log/slog"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/Edgar200021/netowork-server/internal/service/sender"
	"github.com/Edgar200021/netowork-server/internal/storage"
)

var (
	ErrUserExists                    = errors.New("пользователь уже существует")
	ErrUserDoesNotExist              = errors.New("пользователь не существует")
	ErrInvalidCredentials            = errors.New("некорректная эл. почта или пароль")
	ErrAccountNotVerified            = errors.New("пользователь не подтвердил свою эл. почту")
	ErrVerificationTokenDoesNotExist = errors.New("токен подтверждения не существует")
	ErrVerificationTokenExpired      = errors.New("токен подтверждения истек")
)

type AuthService struct {
	userRepository               storage.UserRepository
	verificationTokenRepository  storage.VerificationTokenRepository
	passwordResetTokenRepository storage.PasswordResetTokenRepository
	transactionRepository        storage.TransactionRepository
	log                          *slog.Logger
	applicationConfig            *config.ApplicationConfig
	smtpService                  sender.Sender
}

func NewAuthService(userRepository storage.UserRepository, verificationTokenRepository storage.VerificationTokenRepository,
	passwordResetTokenRepository storage.PasswordResetTokenRepository, transactionRepository storage.TransactionRepository, log *slog.Logger, applicationConfig *config.ApplicationConfig, smtpService sender.Sender) *AuthService {
	return &AuthService{
		userRepository,
		verificationTokenRepository,
		passwordResetTokenRepository,
		transactionRepository,
		log,
		applicationConfig,
		smtpService,
	}
}
