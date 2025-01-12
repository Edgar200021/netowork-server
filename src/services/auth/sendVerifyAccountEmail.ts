import { prisma, redisClient } from '../../app'
import { emailClient } from '../../clients/emailClients'
import { BadRequestError } from '../../common/error'
import { generateRandomToken } from '../../common/lib/generateRandomToken'
import { generateRedisAccountVerificationKey } from '../../common/lib/redis'
import { config } from '../../config/config'

export const sendVerifyAccountEmail = async (
  email: string,
  token?: string,
  checkUser: boolean = false
) => {
  if (checkUser) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new BadRequestError('Пользователь не найден')
  }


  if (!token) token = generateRandomToken()

  await Promise.all([
    emailClient.sendAccountVerificationEmail(email, token),
    redisClient.set(
      generateRedisAccountVerificationKey(token),
      email,
      'EX',
      config.application.accountVerificationTtlInMinutes * 60
    ),
  ])
}
