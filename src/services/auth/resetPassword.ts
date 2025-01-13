import argon2 from 'argon2'
import { prisma, redisClient } from '../../app'
import { BadRequestError } from '../../common/error'
import { generateRedisResetPasswordKey } from '../../common/lib/redis'
import { ResetPasswordRequest } from '../../contracts/auth/resetPassword'

export const resetPassword = async (payload: ResetPasswordRequest) => {
  const key = generateRedisResetPasswordKey(payload.token),
    email = await redisClient.get(key)

  if (!email || !(await prisma.user.findUnique({ where: { email } })))
    throw new BadRequestError('Пользователь не найден')

  console.log(payload.password)

  const hashedPassword = await argon2.hash(payload.password)

  await Promise.all([
    prisma.user.update({
      data: {
        hashedPassword,
      },
      where: {
        email,
      },
    }),
    redisClient.del(key),
  ])
}
