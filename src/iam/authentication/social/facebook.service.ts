import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { User } from 'src/user/interfaces/user.interface';
import { AuthRepository } from '../authentication.repository';
import { AuthService } from '../authentication.service';
import { OAuthConfig } from '../config/oauth.config';
import { FacebookOAuthDto } from '../dto/facebook-oauth.dto';
import { SignInResult } from '../types/sign-in.result';
import {
  FacebookTokenResponse,
  FacebookUserInfoResponse,
} from './interfaces/facebook-response.interface';

@Injectable()
export class FacebookOAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly authRepository: AuthRepository,
    @Inject(OAuthConfig.KEY)
    private readonly OAuthConfiguration: ConfigType<typeof OAuthConfig>,
  ) {}

  generateAuthorizeUrl() {
    const searchParams = new URLSearchParams({
      client_id: this.OAuthConfiguration.facebookClientId!,
      redirect_uri: this.OAuthConfiguration.facebookRedirectUrl!,
      state: '1i2yujy9wy5j',
      scope: this.OAuthConfiguration.facebookScope!,
    });

    const url = `${this.OAuthConfiguration.facebookAuthorizeUrl}?${searchParams.toString()}`;
    return url;
  }

  async signIn({ code, role }: FacebookOAuthDto): Promise<SignInResult> {
    try {
      const searchParams = new URLSearchParams({
        client_id: this.OAuthConfiguration.facebookClientId!,
        redirect_uri: this.OAuthConfiguration.facebookRedirectUrl!,
        client_secret: this.OAuthConfiguration.facebookClientSecret!,
        code,
      });
      const tokenRequestUrl = `${this.OAuthConfiguration.facebookTokenRequestUrL}?${searchParams.toString()}`;
      const tokenRes = await fetch(tokenRequestUrl);

      const { access_token }: FacebookTokenResponse = await tokenRes.json();

      console.log(access_token);
      searchParams.append('access_token', access_token);
      searchParams.append(
        'fields',
        'id,first_name,last_name,email,picture,verified',
      );

      const userInfoRequestUrl = `${this.OAuthConfiguration.facebookUserInfoRequestUrL}?${searchParams.toString()}`;

      const userInfoRes = await fetch(userInfoRequestUrl);
      const userInfoResponse: FacebookUserInfoResponse =
        await userInfoRes.json();

      console.log(userInfoResponse);

      const user = await this.authRepository.getUserByOAuthId(
        'facebook_id',
        userInfoResponse.id,
      );
      if (user) {
        return this.getFinalResult(user);
      }

      const createdUser = await this.authRepository.facebookOAuth({
        ...userInfoResponse,
        role,
      });
      return this.getFinalResult(createdUser);
    } catch (error) {
      console.log(error);
    }
  }

  private async getFinalResult(user: User): Promise<SignInResult> {
    if (user.is_verified) {
      await this.authService.sendVerificationEmail(user.email);
      return undefined;
    }

    return this.authService.generateTokens(user.id);
  }
}
