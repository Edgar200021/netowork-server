import { User } from 'src/user/interfaces/user.interface';
import { SignInResult } from './sign-in.result';

export type RefreshTokenResult = Required<SignInResult> & {user: User}