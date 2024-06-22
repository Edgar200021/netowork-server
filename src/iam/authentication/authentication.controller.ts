import { Body, Controller, Inject, Post, Res } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import { ResponseService } from '../../common/services/response.service';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../constants/cookie.constants';
import { AuthService } from './authentication.service';
import { jwtConfig } from './config/jwt.config';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly authService: AuthService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  @Post('sign-in')
  async signIn(
    @Res({ passthrough: true }) res: Response,
    @Body() signInDto: SignInDto,
  ) {
    const result = await this.authService.signIn(signInDto);
    if (!result)
      return this.responseService.success(
        'Письмо для верификации отправлена на почту',
      );

    const { accessToken, refreshToken } = result;

    this.attachTokensToCookie(res, accessToken, refreshToken);
  }

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    await this.authService.signUp(signUpDto);

    return this.responseService.success('Регистрация прошла успешно');
  }

  @Post('verify')
  async verify(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verify(verifyEmailDto);
    return this.responseService.success('Почта успешно подтвержден');
  }

  private attachTokensToCookie(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(ACCESS_TOKEN_KEY, accessToken, {
      path: '/',
      httpOnly: this.jwtConfiguration.nodeEnv === 'production',
      maxAge: this.jwtConfiguration.cookieJwtAccessMaxAge,
      secure: this.jwtConfiguration.nodeEnv === 'production',
      signed: true,
    });

    res.cookie(REFRESH_TOKEN_KEY, refreshToken, {
      path: '/',
      httpOnly: this.jwtConfiguration.nodeEnv === 'production',
      maxAge: this.jwtConfiguration.cookieJwtRefreshMaxAge,
      secure: this.jwtConfiguration.nodeEnv === 'production',
      signed: true,
    });
  }
}
