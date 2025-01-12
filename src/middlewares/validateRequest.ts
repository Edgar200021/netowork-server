import { NextFunction, Request, Response } from 'express'
import { ZodSchema } from 'zod'
import {
  errorResponse,
  validationErrorResponse,
} from '../common/response/response'

export const validateRequest =
  (schema: ZodSchema) =>
  async <T>(req: Request<{}, {}, T>, res: Response, next: NextFunction) => {
    if (!req.body) {
      return errorResponse(res, 400, 'Данные отсутствуют')
    }

    const { success, data, error } = await schema.safeParseAsync(req.body)

    if (!success) {
      const errors = Object.entries(error.flatten().fieldErrors).reduce(
        (acc, [key, value]) => {
          if (!value) return acc
          acc[key] = value
          return acc
        },
        {} as Record<string, string[]>
      )

      return validationErrorResponse(res, errors)
    }

    req.body = data
    return next()
  }
