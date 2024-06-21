import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { ResponseService } from '../common/services/response.service';
import { AuthController } from './authentication/authentication.controller';
import { AuthRepository } from './authentication/authentication.repository';
import { AuthService } from './authentication/authentication.service';
import { BcryptService } from './authentication/hashing/bcrypt.service';
import { HashingService } from './authentication/hashing/hashing.service';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [
    ResponseService,
    AuthService,
    AuthRepository,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
})
export class IamModule {}
