import { Module } from '@nestjs/common';
import { MailerService } from 'src/common/providers/mailer.service';
import { UsersModule } from 'src/users/users.module';
import { AuthenticationController } from './authentication/authentication.controller';
import { Argon2Service } from './authentication/providers/argon2.service';
import { AuthenticationService } from './authentication/providers/authentication.service';
import { HashingService } from './authentication/providers/hashing.service';

@Module({
  controllers: [AuthenticationController],
  providers: [
    MailerService,
    AuthenticationService,
    {
      provide: HashingService,
      useClass: Argon2Service,
    },
  ],
  imports: [UsersModule],
})
export class IamModule {}
