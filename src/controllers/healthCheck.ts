import { Request, Response } from 'express'
import { prisma, redisClient } from '../app'
import { HealthCheckError } from '../common/error'
import { handleWrapper } from '../common/handlerWrapper'
import { successResponse } from '../common/response/response'

export const healthCheck = handleWrapper(
  async (req: Request, res: Response) => {
    try {
      await Promise.all([prisma.$queryRaw`SELECT 1`, redisClient.ping()])

      successResponse(res, 'OK')
    } catch (error) {
      throw new HealthCheckError()
    }
  }
)
