import { User } from '@prisma/client'
import { Response } from 'express'
import { prisma, redisClient } from '../../app'
import { BadRequestError } from '../../common/error'
import { generateRedisAccountVerificationKey } from '../../common/lib/redis'
import { SESSION_KEY } from '../../constants/cookie'
import { VerifyAccountRequest } from '../../contracts/auth/verifyAccount'
import { generateSession } from './generateSession'
import { cookieOptions } from './login'

export const verifyAccount = async (
  res: Response,
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

  const [uuid] = await Promise.all([
    generateSession(user.id),
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

  res.cookie(SESSION_KEY, uuid, cookieOptions())

  return user
}
