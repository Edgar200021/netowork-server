import { prisma, redisClient } from '../../app'
import { emailClient } from '../../clients/emailClients'
import { BadRequestError } from '../../common/error'
import { generateRandomToken } from '../../common/lib/generateRandomToken'
import { generateRedisResetPasswordKey } from '../../common/lib/redis'
import { config } from '../../config/config'
import { ForgotPasswordRequest } from '../../contracts/auth/forgotPassword'

export const forgotPassword = async ({ email }: ForgotPasswordRequest) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) throw new BadRequestError('Пользователь не найден')

  const token = generateRandomToken()

  await Promise.all([
    emailClient.sendResetPasswordEmail(email, token),
    redisClient.set(
      generateRedisResetPasswordKey(token),
      user.email,
      'EX',
      config.application.passwordResetTtlInMinutes * 60
    ),
  ])
}
