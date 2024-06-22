export type SignInResult =
  | { accessToken: string; refreshToken: string }
  | undefined;
