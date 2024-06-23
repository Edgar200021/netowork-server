export const AuthTypes = {
  JWT: 'jwt',
  NONE: 'none',
} as const;

export type AuthType = (typeof AuthTypes)[keyof typeof AuthTypes];
