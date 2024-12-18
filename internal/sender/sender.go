package sender

import (
	"fmt"

	"github.com/Edgar200021/netowork-server/internal/config"
	"gopkg.in/gomail.v2"
)

type Sender interface {
	SendVerifyAccountEmail(to, token string) error
	SendResetPasswordEmail(to, token string) error
}

type GomailClient struct {
	applicationConfig *config.ApplicationConfig
	client            *gomail.Dialer
	sender            string
}

func New(smtpConfig *config.SmtpConfig, applicationConfig *config.ApplicationConfig) *GomailClient {
	client := gomail.NewDialer(smtpConfig.Host, smtpConfig.Port, smtpConfig.Username, smtpConfig.Password)

	return &GomailClient{
		applicationConfig: applicationConfig,
		client:            client,
		sender:            smtpConfig.Sender,
	}
}

func (s *GomailClient) SendVerifyAccountEmail(to, token string) error {
	m := gomail.NewMessage()

	m.SetHeader("From", s.sender)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Подтверждение почты")
	m.SetBody("text/html", fmt.Sprintf("Перейдите по <a href=\"%s/%s?token=%s\">ссылке</a>, чтобы подтвердить почту.", s.applicationConfig.ClientURL, s.applicationConfig.VerificationTokenPath, token))

	if err := s.client.DialAndSend(m); err != nil {
		return err
	}

	return nil
}

func (s *GomailClient) SendResetPasswordEmail(to, token string) error {
	m := gomail.NewMessage()

	m.SetHeader("From", s.sender)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Сброс пароля")
	m.SetBody("text/html", fmt.Sprintf("Перейдите по <a href=\"%s/%s?token=%s\">ссылке</a>, чтобы сбросить пароль.", s.applicationConfig.ClientURL, s.applicationConfig.PasswordResetPath, token))

	if err := s.client.DialAndSend(m); err != nil {
		return err
	}

	return nil
}
