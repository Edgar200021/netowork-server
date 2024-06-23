export type AccessJwtPayload = { sub: number };
export type RefreshJwtPayload = AccessJwtPayload & { refreshTokenId: string };
