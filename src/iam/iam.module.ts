import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'src/common/services/email.service';
import { RedisModule } from 'src/redis/redis.module';
import { UserModule } from 'src/user/user.module';
import { ResponseService } from '../common/services/response.service';
import { AuthController } from './authentication/authentication.controller';
import { AuthRepository } from './authentication/authentication.repository';
import { AuthService } from './authentication/authentication.service';
import { jwtConfig } from './authentication/config/jwt.config';
import { OAuthConfig } from './authentication/config/oauth.config';
import { AuthGuard } from './authentication/guards/auth.guard';
import { BcryptService } from './authentication/hashing/bcrypt.service';
import { HashingService } from './authentication/hashing/hashing.service';
import { FacebookOAuthService } from './authentication/social/facebook.service';
import { GoogleOAuthService } from './authentication/social/google.service';
import { AuthorizeGuard } from './authorization/guards/authorize.guard';

@Module({
  imports: [
    ConfigModule,
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(OAuthConfig),
    UserModule,
    RedisModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [AuthController],
  providers: [
    ResponseService,
    AuthService,
    EmailService,
    AuthRepository,
    GoogleOAuthService,
    FacebookOAuthService,

    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizeGuard,
    },
  ],
})
export class IamModule {}
