import { registerAs } from '@nestjs/config';

export const OAuthConfig = registerAs('oauth', () => ({
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUrl: process.env.GOOGLE_REDIRECT_URL,
  googleScope: process.env.GOOGLE_SCOPE,
  facebookClientId: process.env.FACEBOOK_CLIENT_ID,
  facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  facebookRedirectUrl: process.env.FACEBOOK_REDIRECT_URL,
  facebookScope: process.env.FACEBOOK_SCOPE,
  facebookAuthorizeUrl: process.env.FACEBOOK_AUTHORIZE_URL,
  facebookTokenRequestUrL: process.env.FACEBOOK_TOKEN_REQUEST_URL,
  facebookUserInfoRequestUrL: process.env.FACEBOOK_USERINFO_REQUEST_URL,

}));
