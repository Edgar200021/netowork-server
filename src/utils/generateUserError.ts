import { AppError } from '../common/error.js'
import type { User } from '../storage/postgres/types/user.types.js'

export type UserError = {
  message: string
  statusCode: number
  error: AppError
}

export const generateUserError = (
  user: User | undefined,
  options: Partial<{
    notFoundMessage: string
    notVerifiedMessage: string
    bannedMessage: string,
	notFoundCode: 404 | 400
  }> = {
    notFoundMessage: 'User not found',
    notVerifiedMessage: 'User is not verified',
    bannedMessage: 'User is banned',
  }
): UserError => {
  const message =
    (!user
      ? options.notFoundMessage
      : !user.isVerified
        ? options.notVerifiedMessage
        : options.bannedMessage) ?? "User doesn't exist"

  const statusCode = !user ? options.notFoundCode ?? 404 : !user.isVerified ? 400 : 403

  return {
    message,
    statusCode,
    error: new AppError(message, statusCode),
  }
}
