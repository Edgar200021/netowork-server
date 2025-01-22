import { User } from '@prisma/client'
import crypto, { UUID } from 'node:crypto'
import { redisClient } from '../../app'
import { generateRedisLoginSessionKey } from '../../common/lib/redis'
import { config } from '../../config/config'

export const generateSession = async (userId: User['id']): Promise<UUID>  => {
  const uuid = crypto.randomUUID()

  await redisClient.set(
    generateRedisLoginSessionKey(uuid.toString()),
    userId,
    'EX',
    config.application.loginSessionTtlInMinutes * 60
  )

  return uuid}
