import { User } from '@prisma/client'
import { Response } from 'express'
import { prisma, redisClient } from '../../app'
import { BadRequestError } from '../../common/error'
import { generateRedisLoginSessionKey } from '../../common/lib/redis'
import { config } from '../../config/config'
import { SESSION_KEY } from '../../constants/cookie'
import { LoginRequest } from '../../contracts/auth/login'

export const login = async (
  res: Response,
  payload: LoginRequest
): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { email: payload.email } })

  if (!user) throw new BadRequestError('Пользователь не найден')
  if (!user.isVerified)
    throw new BadRequestError('Пользователь не верифицирован')

  const uuid = crypto.randomUUID()

  await redisClient.set(
    generateRedisLoginSessionKey(uuid.toString()),
    user.id,
    'EX',
    config.application.loginSessionTtlInMinutes * 60
  )

  res.cookie(SESSION_KEY, uuid, {
    httpOnly: true,
    secure: config.application.nodeEnv === 'production',
    path: '/',
    signed: true,
  })

  return user
}
