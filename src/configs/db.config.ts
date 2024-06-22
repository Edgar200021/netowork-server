import { ConfigService } from '@nestjs/config';
import { DatabaseOptions } from 'src/database/interfaces/database-options.interface';
import { EnvironmentVariables } from 'src/env.validation';

export const dbConfig = (
  configService: ConfigService<EnvironmentVariables, true>,
): DatabaseOptions => {
  return {
    user: configService.get('POSTGRES_USER'),
    database: configService.get('POSTGRES_DB'),
    host: configService.get('POSTGRES_HOST'),
    password: configService.get('POSTGRES_PASSWORD'),
    port: configService.get('POSTGRES_PORT'),
  };
};
