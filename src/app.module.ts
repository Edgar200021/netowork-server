import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { validateEnv } from './env.validation';
import { IamModule } from './iam/iam.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { emailConfig } from './configs/email.config';
import { dbConfig } from './configs/db.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateEnv,
      isGlobal: true,
    }),
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: dbConfig
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: emailConfig
    }),
    IamModule,
    UserModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
