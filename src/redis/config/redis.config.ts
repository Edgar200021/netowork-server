import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  redisUrl: process.env.REDIS_URL,
  redisRefreshMaxAge: Number(process.env.REDIS_REFRESH_MAX_AGE),
}));
