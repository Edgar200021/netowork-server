import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { HashingService } from './hashing.service';

@Injectable()
export class Argon2Service implements HashingService {
  async hash(payload: string): Promise<string> {
    try {
      return argon2.hash(payload);
    } catch (error) {
      throw error;
    }
  }

  async verify(payload: string, hashed: string): Promise<boolean> {
    try {
      return argon2.verify(hashed, payload);
    } catch (error) {
      throw error;
    }
  }
}
