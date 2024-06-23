import {
  BadGatewayException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { REQUEST_USER_KEY } from 'src/iam/constants/request.constants';
import { UserRepository } from '../../../user/user.repository';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../../constants/cookie.constants';
import { AuthService } from '../authentication.service';
import { jwtConfig } from '../config/jwt.config';
import { AuthType, AuthTypes } from '../constants/auth-type.constant';
import { AUTH_TYPE_KEY } from '../decorators/auth.decorator';
import { AccessJwtPayload } from '../types/jwt.payload';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>(),
      res = context.switchToHttp().getRequest<Response>();

    const authType = this.reflector.get<AuthType | undefined, string>(
      AUTH_TYPE_KEY,
      context.getHandler(),
    );

    console.log(authType);

    if (!authType || authType === AuthTypes.NONE) return true;

    return this.verifyToken(req, res);
  }

  private async verifyToken(req: Request, res: Response) {
    const accessToken = req.signedCookies[ACCESS_TOKEN_KEY];
    if (accessToken) {
      try {
        const { sub } = await this.jwtService.verifyAsync<AccessJwtPayload>(
          accessToken,
          { secret: this.jwtConfiguration.secret },
        );

        const user = await this.userRepository.getById(sub);
        if (!user) throw new BadGatewayException('Пользователь не существует');

        req[REQUEST_USER_KEY] = user;
        return true;
      } catch (error) {
        console.log(error);
        throw new InternalServerErrorException('Что-то пошло не так');
      }
    }

    const {
      user,
      accessToken: access,
      refreshToken: refresh,
    } = await this.authService.refreshTokens(
      req.signedCookies[REFRESH_TOKEN_KEY],
    );

    this.attachTokensToCookie(res, access, refresh);
    req[REQUEST_USER_KEY] = user;
    return true;
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
