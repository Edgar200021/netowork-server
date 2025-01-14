import { redisClient } from '../../app'
import { generateRedisLoginSessionKey } from '../../common/lib/redis'

export const logout = async (sessionId: string) => {
  await redisClient.del(generateRedisLoginSessionKey(sessionId))
}
