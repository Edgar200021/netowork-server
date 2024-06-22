import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { User } from './interfaces/user.interface';

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getUserById(id: number): Promise<User | undefined> {
    const result = await this.databaseService.runQuery(
      `SELECT * FROM users
	   WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.databaseService.runQuery(
      `SELECT * FROM users
	   WHERE email = $1`,
      [email],
    );

    return result.rows[0];
  }
}
