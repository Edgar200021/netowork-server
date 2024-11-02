package redis

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/Edgar200021/netowork-server/internal/config"
	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	client *redis.Client
}

func New(config *config.RedisConfig) (*RedisClient, error) {
	client := redis.NewClient(config.ConnectOptions())

	if _, err := client.Get(context.Background(), "ping").Result(); err != nil && !errors.Is(err, redis.Nil) {
		return nil, err
	}

	return &RedisClient{
		client,
	}, nil
}

func (c *RedisClient) Close() {
	c.client.Shutdown(context.Background())
}

func (c *RedisClient) Get(ctx context.Context, key string) (string, error) {
	val, err := c.client.Get(ctx, key).Result()

	if errors.Is(err, redis.Nil) {
		return "", nil
	}

	if err != nil {
		return "nil", err
	}

	return val, nil
}

func (c *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {

	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return c.client.Set(ctx, key, bytes, expiration).Err()
}

func (c *RedisClient) Del(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}
