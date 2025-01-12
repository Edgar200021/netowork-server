import { Response } from 'express'
import {
  ErrorResponse,
  SuccessResponse,
  ValidationErrorResponse,
} from '../../contracts/base'
export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    status: 'success',
    data,
  })
}

export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    status: 'error',
    error: message,
  })
}

export const validationErrorResponse = (
  res: Response,
  errors: Record<string, string[]>
): Response<ValidationErrorResponse> => {
  return res.status(400).json({
    status: 'error',
    errors,
  })
}
