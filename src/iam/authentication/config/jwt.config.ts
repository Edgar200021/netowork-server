import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES,
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES,
  cookieJwtAccessMaxAge: Number(process.env.COOKIE_JWT_ACCESS_MAX_AGE),
  cookieJwtRefreshMaxAge: Number(process.env.COOKIE_JWT_REFRESH_MAX_AGE),
  redisRefreshMaxAge: Number(process.env.REDIS_REFRESH_MAX_AGE),
  nodeEnv: process.env.NODE_ENV
}));
