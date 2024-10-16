use redis::{aio::MultiplexedConnection, FromRedisValue, ToRedisArgs};

use crate::{configuration::RedisSettings, error::Result};

#[derive(Debug)]
pub struct RedisClient {
    conn: MultiplexedConnection,
}

impl RedisClient {
    pub async fn try_new(redis_settings: RedisSettings) -> core::result::Result<Self, String> {
        let client = redis::Client::open(redis_settings.connection_string()).map_err(|e| {
            tracing::error!("{e}");
            "Failed to create redis client".to_string()
        })?;

        let mut conn = client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| {
                tracing::error!("{e}");
                "Failed to create redis connection".to_string()
            })?;

        redis::cmd("PING")
            .exec_async(&mut conn)
            .await
            .map_err(|e| {
                tracing::error!("{e}");
                "Failed to ping redis".to_string()
            })?;

        Ok(Self { conn })
    }

    #[tracing::instrument(name = "Insert key and value into redis", skip(key, value))]
    pub async fn insert<T: ToRedisArgs>(&mut self, key: T, value: T) -> Result<()> {
        redis::cmd("SET")
            .arg(&[key, value])
            .exec_async(&mut self.conn)
            .await?;

        Ok(())
    }

    #[tracing::instrument(name = "Get value from redis", skip(key))]
    pub async fn get<T: ToRedisArgs, RV: FromRedisValue>(&mut self, key: T) -> Result<Option<RV>> {
        let value = redis::cmd("GET")
            .arg(key)
            .query_async(&mut self.conn)
            .await?;

        Ok(value)
    }

    #[tracing::instrument(name = "Delete key from redis", skip(key))]
    pub async fn delete<T: ToRedisArgs>(&mut self, key: T) -> Result<()> {
        redis::cmd("DELETE")
            .arg(key)
            .exec_async(&mut self.conn)
            .await?;

        Ok(())
    }
}
