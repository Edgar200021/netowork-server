import { plainToInstance, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  validate,
  ValidateNested,
} from 'class-validator';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

export class SmtpConfig {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  port: number;

  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  from: string;
}
export class RedisConfig {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  port: number;

  @IsString()
  password: string;

  @IsNumber()
  @IsOptional()
  ttl?: number;
}

export class DatabaseConfig {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  port: number;

  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  database: string;

  @IsBoolean()
  @IsNotEmpty()
  ssl: boolean;
}

class ClientApplication {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  accountVerificationPath: string;
}

export class ApplicationConfig {
  @IsNumber()
  @Min(0)
  @Max(65535)
  port: number;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['development', 'production', 'test'])
  environment: string;

  @IsNumber()
  @IsNotEmpty()
  accountVerificationTtlInMinutes: number;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => ClientApplication)
  clientApplication: ClientApplication;
}

export class Config {
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => ApplicationConfig)
  application: ApplicationConfig;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => DatabaseConfig)
  database: DatabaseConfig;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => RedisConfig)
  redis: RedisConfig;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => SmtpConfig)
  smtp: SmtpConfig;
}

export default async () => {
  let env = process.env.NODE_ENV;

  if (!env) {
    env = 'development';
  }

  const configPath = path.join(__dirname, '../../configs', `${env}.yaml`);

  if (!fs.existsSync(configPath)) throw new Error('No config file found');

  const yamlConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));

  const config = plainToInstance(Config, yamlConfig);
  const validationErrors = await validate(config);

  if (validationErrors.length > 0) {
    const errors = [];
    validationErrors.forEach((error) => {
      error.children?.forEach((v) =>
        Object.entries(v.constraints).map((value) => errors.push(value[1])),
      );
    });

    throw new Error(errors.join('\n'));
  }

  return config;
};
