package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"path"
	"strings"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Config struct {
	HTTPServer  HTTPServerConfig  `yaml:"http_server" env-required:"true"`
	Application ApplicationConfig `yaml:"application" env-required:"true"`
	Smtp        SmtpConfig        `yaml:"smtp" env-required:"true"`
	Database    DatabaseConfig    `yaml:"database" env-required:"true"`
}

type HTTPServerConfig struct {
	Port         uint          `yaml:"port" env-required:"true"`
	Host         string        `yaml:"host"  env-required:"true"`
	WriteTimeout time.Duration `yaml:"write_timeout" env-default:"5s"`
	ReadTimeout  time.Duration `yaml:"read_timeout" env-default:"5s"`
	IdleTimeout  time.Duration `yaml:"idle_timeout" env-default:"100s"`
}

type ApplicationConfig struct {
	ClientURL             string        `yaml:"client_url" env-required:"true"`
	VerificationTokenTTL  time.Duration `yaml:"verification_token_ttl" env-default:"1d"`
	PasswordResetTokenTTL time.Duration `yaml:"password_reset_token_ttl" env-default:"10m"`
	VerificationTokenPath string        `yaml:"verification_token_path" env-required:"true"`
	PasswordResetPath   string        `yaml:"password_reset_path" env-required:"true"`
}

type SmtpConfig struct {
	Host     string `yaml:"host" env-required:"true"`
	Port     int    `yaml:"port" env-required:"true"`
	Username string `yaml:"username" env-required:"true"`
	Password string `yaml:"password" env-required:"true"`
	Sender   string `yaml:"sender" env-required:"true"`
}

type DatabaseConfig struct {
	User     string `yaml:"user" env-required:"true"`
	Password string `yaml:"password" env-required:"true"`
	Port     uint   `yaml:"port" env-required:"true"`
	Host     string `yaml:"host" env-required:"true"`
	Name     string `yaml:"name" env-required:"true"`
	SslMode  *bool  `yaml:"ssl_mode" env-required:"true"`
}

func (d *DatabaseConfig) ConnectOptions() *pgxpool.Config {
	const defaultMaxConns = int32(4)
	const defaultMinConns = int32(0)
	const defaultMaxConnLifetime = time.Hour
	const defaultMaxConnIdleTime = time.Minute * 30
	const defaultHealthCheckPeriod = time.Minute
	const defaultConnectTimeout = time.Second * 5

	var sslMode string

	if *d.SslMode {
		sslMode = "require"
	} else {
		sslMode = "disable"
	}

	database_url := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s", d.User, d.Password, d.Host, d.Port, d.Name, sslMode)

	dbConfig, err := pgxpool.ParseConfig(database_url)
	if err != nil {
		log.Fatal("Failed to create a config, error: ", err)
	}

	dbConfig.MaxConns = defaultMaxConns
	dbConfig.MinConns = defaultMinConns
	dbConfig.MaxConnLifetime = defaultMaxConnLifetime
	dbConfig.MaxConnIdleTime = defaultMaxConnIdleTime
	dbConfig.HealthCheckPeriod = defaultHealthCheckPeriod
	dbConfig.ConnConfig.ConnectTimeout = defaultConnectTimeout

	dbConfig.BeforeAcquire = func(ctx context.Context, c *pgx.Conn) bool {
		log.Println("Before acquiring the connection pool to the database!!")
		return true
	}

	dbConfig.AfterRelease = func(c *pgx.Conn) bool {
		log.Println("After releasing the connection pool to the database!!")
		return true
	}

	dbConfig.BeforeClose = func(c *pgx.Conn) {
		log.Println("Closed the connection pool to the database!!")
	}

	return dbConfig

}

func New() *Config {
	env := os.Getenv("ENV")

	if strings.TrimSpace(env) == "" {
		env = "local"
	}

	dir, err := os.Getwd()
	if err != nil {
		log.Fatal("Failed to get current directory")
	}

	configPath := path.Join(dir, "config", fmt.Sprintf("%s.yaml", env))

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		log.Fatal("Config file does not exist")
	}

	var cfg Config

	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		log.Fatal("Failed to read config: ", err)
	}

	return &cfg

}
