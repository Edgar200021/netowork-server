import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'node:crypto';
import { EmailService } from 'src/common/services/email.service';
import { RedisService } from 'src/redis/redis.service';
import { User } from 'src/user/interfaces/user.interface';
import { UserRepository } from '../../user/user.repository';
import { AuthRepository } from './authentication.repository';
import { jwtConfig } from './config/jwt.config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { HashingService } from './hashing/hashing.service';
import { RefreshJwtPayload } from './types/jwt.payload';
import { RefreshTokenResult } from './types/refresh-token.results';
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
    const user = await this.userRepository.getByEmail(email);
    if (!user || !(await this.hashingService.compare(password, user.password)))
      throw new BadRequestException('Неправильный эл.адрес или пароль');

    if (!user.is_verified) {
      await this.sendVerificationEmail(email);
      return undefined;
    }

    return this.generateTokens(user.id);
  }

  async signUp({ email, password, name, lastName, role }: SignUpDto) {
    const user = await this.userRepository.getByEmail(email);
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
    const user = await this.userRepository.getByEmail(email);

    if (
      !user ||
      !(await this.hashingService.compare(token, user.verification_token || ''))
    )
      throw new BadRequestException(
        `Пользователь с эл.почтой ${email} не существует`,
      );

    if (
      new Date().getTime() >=
      new Date(user.verification_expires || Date.now()).getTime()
    ) {
      await this.authRepository.updateVerificationToken(email, null, null);
      throw new BadRequestException('Время срока верификации аккаунта истек');
    }

    await Promise.all([
      this.authRepository.updateIsVerified(email, true),
      this.authRepository.updateVerificationToken(email, null, null),
    ]);
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.userRepository.getByEmail(email);
    if (!user)
      throw new NotFoundException('Пользователя с таким email не существует');

    await this.sendResetPasswordEmail(email);
  }

  async resetPassword({ password, email, token }: ResetPasswordDto) {
    const user = await this.userRepository.getByEmail(email);
    if (
      !user ||
      !(await this.hashingService.compare(
        token,
        user.password_reset_token || '',
      ))
    )
      throw new BadRequestException(
        `Пользователь с эл.почтой ${email} не существует`,
      );

    if (
      new Date().getTime() >=
      new Date(user.password_reset_expires || Date.now()).getTime()
    ) {
      await this.authRepository.updateVerificationToken(email, null, null);
      throw new BadRequestException('Время срока верификации аккаунта истек');
    }

    const hashedPassword = await this.hashingService.hash(password);

    await Promise.all([
      this.userRepository.updatePassword(email, hashedPassword),
      this.authRepository.updateVerificationToken(email, null, null),
    ]);
  }

  async refreshTokens(refreshToken: string): Promise<RefreshTokenResult> {
    try {
      const { sub, refreshTokenId } =
        await this.jwtService.verifyAsync<RefreshJwtPayload>(refreshToken, {
          secret: this.jwtConfiguration.secret,
        });

      const user = await this.userRepository.getById(sub);
      if (!user) throw new UnauthorizedException('Пользователь не существует');

      const redisId = this.generateRedisId(user.id);
      const storageRefreshToken = await this.redisService.get(redisId);

      if (storageRefreshToken !== refreshTokenId)
        throw new UnauthorizedException('Ошибка авторизации');

      await this.redisService.delete(redisId);

      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(user.id);

      return { user, accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Ошибка авторизации');
    }
  }

  async sendVerificationEmail(email: string) {
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

  private async sendResetPasswordEmail(email: string) {
    const token = crypto.randomBytes(16).toString('hex');
    const encrypted = await this.hashingService.hash(token);

    try {
      await Promise.all([
        this.authRepository.updateResetPasswordToken(
          email,
          encrypted,
          new Date(Date.now() + 1000 * 60 * 15),
        ),
        this.emailService.sendResetPasswordEmail(email, token),
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
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );

    return token;
  }

  async generateTokens(userId: User['id']) {
    try {
      const refreshTokenId = crypto.randomUUID();
      const [accessToken, refreshToken] = await Promise.all([
        this.generateToken(userId, this.jwtConfiguration.jwtAccessExpires!),
        this.generateToken<{ refreshTokenId: string }>(
          userId,
          this.jwtConfiguration.jwtRefreshExpires!,
          {
            refreshTokenId,
          },
        ),
      ]);

      const id = this.generateRedisId(userId);

      this.redisService.insert(id, refreshTokenId, {
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

  private generateRedisId(userId: User['id']): string {
    return `user-${userId}`;
  }
}
