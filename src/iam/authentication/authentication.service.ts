import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'node:crypto';
import { EmailService } from 'src/common/services/email.service';
import { RedisService } from 'src/redis/redis.service';
import { UserRepository } from '../../user/user.repository';
import { AuthRepository } from './authentication.repository';
import { jwtConfig } from './config/jwt.config';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { HashingService } from './hashing/hashing.service';
import { SignInResult } from './types/sign-in.result';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
    private readonly hashingService: HashingService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async signIn({ email, password }: SignInDto): Promise<SignInResult> {
    const user = await this.userRepository.getUserByEmail(email);
    if (!user || !(await this.hashingService.compare(password, user.password)))
      throw new BadRequestException('Неправильный эл.адрес или пароль');

    if (!user.is_verified) {
      await this.sendVerificationEmail(email);
      return undefined;
    }

    return this.generateTokens(user.id);
  }

  async signUp({ email, password, name, lastName, role }: SignUpDto) {
    const user = await this.userRepository.getUserByEmail(email);
    if (user)
      throw new BadRequestException(
        `Пользователь с эл. почтой ${email} уже существует`,
      );

    const hashedPassword = await this.hashingService.hash(password);

    await this.authRepository.signUp({
      email,
      name,
      lastName,
      hashedPassword,
      role,
    });
  }

  async verify({ email, token }: VerifyEmailDto) {
    const user = await this.userRepository.getUserByEmail(email);

    if (!user)
      throw new BadRequestException(
        `Пользователь с эл.почтой ${email} не существует`,
      );

    if (
      !(await this.hashingService.compare(token, user.verification_token)) ||
      new Date().getTime() > new Date(user.verification_expires).getTime()
    ) {
      await this.authRepository.updateVerificationToken(email, null, null);
      throw new BadRequestException('Время срока верификации аккаунта истек');
    }

    await Promise.all([
      this.authRepository.updateIsVerified(email, true),
      this.authRepository.updateVerificationToken(email, null, null),
    ]);
  }

  private async sendVerificationEmail(email: string) {
    const token = crypto.randomBytes(16).toString('hex');
    const encrypted = await this.hashingService.hash(token);

    try {
      await Promise.all([
        this.authRepository.updateVerificationToken(
          email,
          encrypted,
          new Date(Date.now() + 1000 * 60 * 15),
        ),
        this.emailService.sendVerificationEmail(email, token),
      ]);
    } catch (error) {
      console.log(error);

      throw new InternalServerErrorException(
        'Что-то пошло не так. Повторите попытку чуть позже',
      );
    }
  }

  private async generateToken<T>(
    userId: number,
    expiresIn: string | number,
    payload?: T,
  ) {
    const token = await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        expiresIn,
      },
    );

    return token;
  }

  private async generateTokens(userId: number) {
    try {
      const refreshId = crypto.randomUUID();
      const [accessToken, refreshToken] = await Promise.all([
        this.generateToken(userId, this.jwtConfiguration.jwtAccessExpires),
        this.generateToken<{ refreshId: string }>(
          userId,
          this.jwtConfiguration.jwtRefreshExpires,
          {
            refreshId,
          },
        ),
      ]);

      this.redisService.insert(`user-${userId}`, refreshId, {
        EX: this.jwtConfiguration.redisRefreshMaxAge,
      });

      return { accessToken, refreshToken };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Что-то пошло не так. Повторите попытку чуть позже',
      );
    }
  }
}
