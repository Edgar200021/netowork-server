import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async signIn() {}

  async signUp(
    signUpDto: Omit<SignUpDto, 'password'> & { hashedPassword: string },
  ) {
    await this.databaseService.runQuery(
      'INSERT INTO users (email, password, name, last_name, role ) VALUES ($1, $2, $3, $4)',
      [
        signUpDto.email,
        signUpDto.hashedPassword,
        signUpDto.name,
        signUpDto.lastName,
      ],
    );
  }
}
