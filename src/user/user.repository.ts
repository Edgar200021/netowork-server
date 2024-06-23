import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { User } from './interfaces/user.interface';

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getById(id: number): Promise<User | undefined> {
    const result = await this.databaseService.runQuery(
      `SELECT * FROM users
	   WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  }

  async getByEmail(email: string): Promise<User | undefined> {
    const result = await this.databaseService.runQuery(
      `SELECT * FROM users
	   WHERE email = $1`,
      [email],
    );

    return result.rows[0];
  }

  async updatePassword(email: string, password: string) {
    await this.databaseService.runQuery(
      `UPDATE users
	   SET password = $1
	   WHERE email = $2`,
      [password,email],
    );
  }
}
