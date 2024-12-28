import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { cacheConfig } from './config/cache';
import configuration from './config/configuration';
import { DrizzleModule } from './drizzle/drizzle.module';
import { IamModule } from './iam/iam.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: cacheConfig,
      inject: [ConfigService],
    }),
    DrizzleModule,
    UsersModule,
    IamModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
