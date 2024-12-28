import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { UsersRepository } from './providers/users.repository';
import { UsersService } from './providers/users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [DrizzleModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
