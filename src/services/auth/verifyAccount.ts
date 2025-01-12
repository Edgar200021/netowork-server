import { User } from '@prisma/client'
import { prisma, redisClient } from '../../app'
import { BadRequestError } from '../../common/error'
import { generateRedisAccountVerificationKey } from '../../common/lib/redis'
import { VerifyAccountRequest } from '../../contracts/auth/verifyAccount'

export const verifyAccount = async (
  payload: VerifyAccountRequest
): Promise<User> => {
  const key = generateRedisAccountVerificationKey(payload.token),
    email = await redisClient.get(key)

  if (!email) {
    throw new BadRequestError('Пользователь не найден')
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || user.isVerified) {
    await redisClient.del(key)

    throw new BadRequestError(
      !user ? 'Пользователь не найден' : 'Пользователь уже верифицирован'
    )
  }

  await Promise.all([
    prisma.user.update({
      data: {
        isVerified: true,
      },
      where: {
        email,
      },
    }),
    redisClient.del(key),
  ])

  return user
}
