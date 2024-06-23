import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  POSTGRES_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  POSTGRES_PORT: number;

  @IsString()
  POSTGRES_USER: string;

  @IsString()
  POSTGRES_PASSWORD: string;

  @IsString()
  POSTGRES_DB: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_ACCESS_EXPIRES: string;

  @IsString()
  JWT_REFRESH_EXPIRES: string;

  @IsNumber()
  COOKIE_JWT_ACCESS_MAX_AGE: number;

  @IsNumber()
  COOKIE_JWT_REFRESH_MAX_AGE: number;

  @IsNumber()
  REDIS_REFRESH_MAX_AGE: number;

  @IsString()
  COOKIE_SECRET: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  SMTP_USER: string;

  @IsString()
  SMTP_PASSWORD: string;

  @IsString()
  SMTP_HOST: string;

  @IsNumber()
  SMTP_PORT: number;

  @IsNumber()
  CLOUDINARY_API_KEY: number;

  @IsString()
  CLOUDINARY_API_SECRET: string;

  @IsString()
  CLOUDINARY_CLOUD_NAME: string;

  @IsString()
  CLOUDINARY_FOLDER: string;

  @IsString()
  CLIENT_URL: string;

  @IsString()
  CLIENT_VERIFICATION_URL: string;

  @IsString()
  CLIENT_RESET_PASSWORD_URL: string;

  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  GOOGLE_REDIRECT_URL: string;

  @IsString()
  FACEBOOK_CLIENT_SECRET: string;

  @IsString()
  FACEBOOK_CLIENT_ID: string;

  @IsString()
  FACEBOOK_REDIRECT_URL: string;


  @IsString()
  FACEBOOK_SCOPE: string;

  @IsString()
  FACEBOOK_AUTHORIZE_URL: string;

  @IsString()
  FACEBOOK_TOKEN_REQUEST_URL: string

  @IsString()
  FACEBOOK_USERINFO_REQUEST_URL: string
}

export const validateEnv = (config: Record<string, unknown>) => {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
};
