import { SetMetadata } from '@nestjs/common';
import { AuthType } from '../constants/auth-type.constant';

export const AUTH_TYPE_KEY = 'auth';

export const Auth = (authType: AuthType) =>
  SetMetadata(AUTH_TYPE_KEY, authType);
