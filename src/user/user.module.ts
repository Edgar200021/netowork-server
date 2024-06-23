import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';

@Module({
  providers: [UserRepository],
  exports: [UserRepository],
  controllers: [UserController],
})
export class UserModule {}
