import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { RedisClientType, SetOptions } from '@redis/client';
import { createClient } from 'redis';
import { redisConfig } from './config/redis.config';

@Injectable()
export class RedisService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private redisClient: RedisClientType;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly redisConfiguration: ConfigType<typeof redisConfig>,
  ) {}

  async onApplicationBootstrap() {
    this.redisClient = createClient({
      url: this.redisConfiguration.redisUrl,
    });

    await this.redisClient.connect();
    this.redisClient.on('error', () => {
      process.exit(1);
    });
  }

  async onApplicationShutdown() {
    await this.redisClient.disconnect();
    await this.redisClient.quit();
  }

  async get(key: string) {
    return await this.redisClient.get(key);
  }

  async insert(key: string, value: any, options?: SetOptions) {
    await this.redisClient.set(key, value, options);
  }

  async delete(key: string) {
    await this.redisClient.del(key);
  }
}
