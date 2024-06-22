import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async signUp(
    signUpDto: Omit<SignUpDto, 'password'> & { hashedPassword: string },
  ) {
    await this.databaseService.runQuery(
      `INSERT INTO users (email, password, name, last_name, role)
	   VALUES ($1, $2, $3, $4, $5)`,
      [
        signUpDto.email,
        signUpDto.hashedPassword,
        signUpDto.name,
        signUpDto.lastName,
        signUpDto.role,
      ],
    );
  }

  async updateVerificationToken(
    email: string | null,
    token: string | null,
    tokenExpires: Date,
  ) {
    await this.databaseService.runQuery(
      `UPDATE users 
	   SET verification_token = $1, verification_expires = $2
	   WHERE email = $3`,
      [token, tokenExpires, email],
    );
  }

  async updateIsVerified(email: string, isVerified: boolean) {
    await this.databaseService.runQuery(
      `UPDATE users
	   SET is_verified = $1, verification_token = null, verification_expires = null
	   WHERE email = $2`,
      [isVerified, email],
    );
  }
}
