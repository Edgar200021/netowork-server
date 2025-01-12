import { NextFunction, Request, Response } from 'express'
import { AppError, ValidationError } from '../common/error'
import {
  errorResponse,
  validationErrorResponse,
} from '../common/response/response'

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    if ((err as ValidationError).errors !== undefined) {
      return validationErrorResponse(res, (err as ValidationError).errors)
    }
    return errorResponse(res, err.statusCode, err.message)
  }

  return res.status(500).json({
    status: 'error',
    error: 'Что-то пошло не так',
  })
}
