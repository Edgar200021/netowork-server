import { Injectable } from '@nestjs/common';
import { TokenPayload } from 'google-auth-library';
import { UserRole } from 'src/user/constants/user-role.const';
import { User } from 'src/user/interfaces/user.interface';
import { DatabaseService } from '../../database/database.service';
import { SignUpDto } from './dto/sign-up.dto';
import { FacebookUserInfoResponse } from './social/interfaces/facebook-response.interface';

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

  async googleOAuth(
    payload: Pick<
      TokenPayload,
      'sub' | 'email' | 'email_verified' | 'picture' | 'name' | 'given_name'
    > & { role: Omit<UserRole, 'admin'> },
  ): Promise<User> {
    try {
      const res = await this.databaseService.runQuery(
        `INSERT INTO users (name, last_name,email, is_verified, avatar, google_id, role)
		 VALUES ($1, $2, $3, $4, $5, $6, &7)
		 ON CONFLICT (email) DO UPDATE
		 SET email = $3
		 RETURNING *
			 `,
        [
          payload.name,
          payload.given_name,
          payload.email,
          payload.email_verified,
          payload.picture,
          payload.sub,
          payload.role,
        ],
      );

      return res.rows[0];
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async facebookOAuth(
    payload: FacebookUserInfoResponse & { role: Omit<UserRole, 'admin'> },
  ): Promise<User> {
    try {
      const res = await this.databaseService.runQuery(
        `INSERT INTO users (name, last_name,email, avatar, facebook_id, role)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (email) DO UPDATE
		 SET email = $3
		 RETURNING *
			 `,
        [
          payload.first_name,
          payload.last_name,
          payload.email,
          payload.picture.data.url,
          payload.id,
          payload.role,
        ],
      );

      return res.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async updateVerificationToken(
    email: string,
    token: string | null,
    tokenExpires: Date | null,
  ) {
    await this.databaseService.runQuery(
      `UPDATE users 
	   SET verification_token = $1, verification_expires = $2
	   WHERE email = $3`,
      [token, tokenExpires, email],
    );
  }

  async updateResetPasswordToken(
    email: string,
    token: string | null,
    tokenExpires: Date | null,
  ) {
    await this.databaseService.runQuery(
      `UPDATE users 
	   SET password_reset_token = $1, password_reset_expires = $2
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

  async getUserByOAuthId(
    key: keyof Pick<User, 'google_id' | 'facebook_id'>,
    value: User['google_id' | 'facebook_id'],
  ): Promise<User | undefined> {
    const result = await this.databaseService.runQuery(
      `SELECT * FROM users
														WHERE ${key} = $1`,
      [value],
    );

    return result.rows[0];
  }
}
