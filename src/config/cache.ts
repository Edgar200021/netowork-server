import { CacheManagerOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { Config, RedisConfig } from './configuration';

export const cacheConfig = async (
  config: ConfigService<Config, true>,
): Promise<CacheManagerOptions> => {
  const redisConfig = config.getOrThrow<RedisConfig>('redis');

  const store = await redisStore({
    socket: {
      host: redisConfig.host,
      port: redisConfig.port,
    },
    ttl: redisConfig.ttl || 30 * 1000,
  });

  return {
    store: () => store,
  };
};
