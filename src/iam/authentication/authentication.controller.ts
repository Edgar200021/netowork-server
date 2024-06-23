import { Body, Controller, Get, Inject, Post, Res } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import { ResponseService } from '../../common/services/response.service';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../constants/cookie.constants';
import { AuthService } from './authentication.service';
import { jwtConfig } from './config/jwt.config';
import { FacebookOAuthDto } from './dto/facebook-oauth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleOAuthDto } from './dto/google-oauth.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { FacebookOAuthService } from './social/facebook.service';
import { GoogleOAuthService } from './social/google.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly authService: AuthService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly facebookOAuthService: FacebookOAuthService,
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
    return this.responseService.success('Вы успешно зашли в аккаунте');
  }

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    await this.authService.signUp(signUpDto);

    return this.responseService.success('Регистрация прошла успешно');
  }

  @Post('verify')
  async verify(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verify(verifyEmailDto);
    return this.responseService.success('Почта успешно подтверждена');
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);

    return this.responseService.success(
      'Письмо для восстановления пароля успешно отправлен на почту',
    );
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);

    return this.responseService.success('Пароль успешно обновлен');
  }

  @Get('google')
  generateGoogleAuthorizeUrl() {
    const url = this.googleOAuthService.generateAuthorizeUrl();

    return this.responseService.success(url);
  }

  @Post('google')
  async googleSignIn(
    @Body() googleOAuthDto: GoogleOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.googleOAuthService.signIn(googleOAuthDto);
    if (!result)
      return this.responseService.success(
        'Письмо для верификации отправлена на почту',
      );

    const { accessToken, refreshToken } = result;

    this.attachTokensToCookie(res, accessToken, refreshToken);
    return this.responseService.success('Вы успешно зашли в аккаунте');
  }

  @Get('facebook')
  generateFacebookAuthorizeUrl() {
    const url = this.facebookOAuthService.generateAuthorizeUrl();
    console.log(url);

    return this.responseService.success(url);
  }

  @Post('facebook')
  async facebookSignIn(@Body() facebookOAuthDto: FacebookOAuthDto) {
    await this.facebookOAuthService.signIn(facebookOAuthDto);

    return this.responseService.success('Ok');
  }

  private attachTokensToCookie(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(ACCESS_TOKEN_KEY, accessToken, {
      path: '/',
      httpOnly: true,
      maxAge: this.jwtConfiguration.cookieJwtAccessMaxAge,
      secure: this.jwtConfiguration.nodeEnv === 'production',
      signed: true,
    });

    res.cookie(REFRESH_TOKEN_KEY, refreshToken, {
      path: '/',
      httpOnly: true,
      maxAge: this.jwtConfiguration.cookieJwtRefreshMaxAge,
      secure: this.jwtConfiguration.nodeEnv === 'production',
      signed: true,
    });
  }
}
