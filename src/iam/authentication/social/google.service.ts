import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { User } from 'src/user/interfaces/user.interface';
import { AuthRepository } from '../authentication.repository';
import { AuthService } from '../authentication.service';
import { OAuthConfig } from '../config/oauth.config';
import { GoogleOAuthDto } from '../dto/google-oauth.dto';
import { SignInResult } from '../types/sign-in.result';

@Injectable()
export class GoogleOAuthService implements OnModuleInit {
  client: OAuth2Client;

  constructor(
    @Inject(OAuthConfig.KEY)
    private readonly OAuthConfiguration: ConfigType<typeof OAuthConfig>,
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService,
  ) {}

  onModuleInit() {
    this.client = new OAuth2Client({
      clientId: this.OAuthConfiguration.googleClientId,
      clientSecret: this.OAuthConfiguration.googleClientSecret,
      redirectUri: this.OAuthConfiguration.googleRedirectUrl,
    });
  }

  generateAuthorizeUrl() {
    const url = this.client.generateAuthUrl({
      scope: this.OAuthConfiguration.googleScope,
    });

    return url;
  }

  async signIn({ code, role }: GoogleOAuthDto): Promise<SignInResult> {
    try {
      const {
        tokens: { id_token },
      } = await this.client.getToken(code);
      const ticket = await this.client.verifyIdToken({
        idToken: id_token || '',
      });

      const payload = ticket.getPayload();
      if (!payload) throw new NotFoundException('Пользователь не существует');

      const user = await this.authRepository.getUserByOAuthId(
        'google_id',
        payload.sub,
      );

      if (user) {
        return this.getFinalResult(user);
      }

      const createdUser = await this.authRepository.googleOAuth({...payload, role});

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
