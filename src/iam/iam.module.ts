import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'src/common/services/email.service';
import { RedisModule } from 'src/redis/redis.module';
import { UserModule } from 'src/user/user.module';
import { ResponseService } from '../common/services/response.service';
import { AuthController } from './authentication/authentication.controller';
import { AuthRepository } from './authentication/authentication.repository';
import { AuthService } from './authentication/authentication.service';
import { jwtConfig } from './authentication/config/jwt.config';
import { BcryptService } from './authentication/hashing/bcrypt.service';
import { HashingService } from './authentication/hashing/hashing.service';

@Module({
  imports: [
    ConfigModule,
    ConfigModule.forFeature(jwtConfig),
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
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
})
export class IamModule {}
