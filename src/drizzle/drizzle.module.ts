import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { databaseConfig } from 'src/config/database';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: databaseConfig,
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DrizzleModule {}
