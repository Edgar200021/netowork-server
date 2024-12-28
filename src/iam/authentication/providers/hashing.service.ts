import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingService {
  abstract hash(payload: string): Promise<string>;
  abstract verify(payload: string, hashed: string): Promise<boolean>;
}
