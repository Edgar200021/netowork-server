import { NextFunction, Request, Response } from 'express'
import { logger, prisma, redisClient } from '../app'
import { AppError, HealthCheckError, ValidationError } from '../common/error'
import {
  errorResponse,
  validationErrorResponse,
} from '../common/response/response'

export const errorHandler = async (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
	logger.info("------------ERRORRRRRRRRRRRR-------------", err)
  logger.error({
    message:
      err instanceof AppError || err instanceof Error ? err.message : err,
    statusCode: err instanceof AppError ? err.statusCode : 500,
  })

  if (err instanceof AppError) {
    logger.error({
      message: err.message,
      statusCode: err.statusCode,
    })

    if ((err as ValidationError).errors !== undefined) {
      return validationErrorResponse(res, (err as ValidationError).errors)
    }

    return errorResponse(res, err.statusCode, err.message)
  }

  if (err instanceof HealthCheckError) {
    errorResponse(res, err.statusCode, 'Наш сервер временно недоступен')
    await Promise.all([redisClient.disconnect(), prisma.$disconnect()])
    process.exit(1)
  }

  return res.status(500).json({
    status: 'error',
    error: 'Что-то пошло не так',
  })
}
