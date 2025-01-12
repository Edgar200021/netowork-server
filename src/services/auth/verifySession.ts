import { Request } from 'express'
import { prisma, redisClient } from '../../app'
import { UnauthorizedError } from '../../common/error'
import { generateRedisLoginSessionKey } from '../../common/lib/redis'
import { config } from '../../config/config'

export const verifySession = async (req: Request, sessionId: string) => {
  const key = generateRedisLoginSessionKey(sessionId),
    id = await redisClient.getex(
      key,
      'EX',
      config.application.loginSessionTtlInMinutes * 60
    )

  if (!id) {
    throw new UnauthorizedError('Не авторизован')
  }

  const user = await prisma.user.findUnique({ where: { id } })

  if (!user) throw new UnauthorizedError('Не авторизован')
  if (!user.isVerified) throw new UnauthorizedError('Пользователь не верифицирован')

  req.user = user
}
