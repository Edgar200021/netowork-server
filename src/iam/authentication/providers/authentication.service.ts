import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { MailerService } from 'src/common/providers/mailer.service';
import { ApplicationConfig, Config } from 'src/config/configuration';
import { UsersRepository } from 'src/users/providers/users.repository';
import { RegisterDto } from '../dto/register.dto';
import { HashingService } from './hashing.service';

@Injectable()
export class AuthenticationService {
  private static readonly verificationCacheKey = 'verification:';

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashingService: HashingService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService<Config, true>,
  ) {}

  public async register(payload: RegisterDto) {
    const appConfig =
      this.configService.getOrThrow<ApplicationConfig>('application');
    const user = await this.usersRepository.getByEmail(payload.email);

    if (user) throw new BadRequestException('User already exists');

    const hashedPassword = await this.hashingService.hash(payload.password);

    const userId = await this.usersRepository.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      hashedPassword,
      role: payload.role,
    });

    const token = this.generateRandomToken();
    await Promise.all([
      this.mailerService.sendVerificationEmail(payload.email, token),
      this.cacheManager.set(
        this.generateCacheKeyForVerificationId(userId),
        token,
        appConfig.accountVerificationTtlInMinutes * 60 * 1000,
      ),
    ]);
  }

  private generateRandomToken(bytes: number = 32): string {
    const token = crypto.randomBytes(bytes).toString('hex');
    return token;
  }

  private generateCacheKeyForVerificationId(userId: number): string {
    return `${AuthenticationService.verificationCacheKey}${userId}`;
  }

  private extractUserIdFromVerificationCacheKey(
    key: string,
  ): number | undefined {
    return Number(key.split(AuthenticationService.verificationCacheKey)[1]);
  }
}
