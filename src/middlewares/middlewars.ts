import vine, { errors } from '@vinejs/vine'
import type { SchemaTypes } from '@vinejs/vine/types'
import type { NextFunction, Request, Response } from 'express'
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/base.js'
import { AppError } from '../common/error.js'
import type { LoggerService } from '../common/services/logger.service.js'

export class Middlewares {
  private static _instance: null | Middlewares = null

  constructor(private readonly _loggerService: LoggerService) {
    if (Middlewares._instance) return Middlewares._instance

    Middlewares._instance = this

    this.handleErrors = this.handleErrors.bind(this)
    this.sendValidationErrors = this.sendValidationErrors.bind(this)
  }

  validateRequest(
    schema: SchemaTypes
  ): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, _: Response, next: NextFunction) => {
      try {
        const validator = vine.compile(schema)
        await validator.validate(req.body)

        next()
      } catch (error) {
        next(error)
      }
    }
  }

  handleErrors(
    err: unknown,
    _: Request,
    res: Response<ErrorResponseDto | ValidationErrorResponseDto>,
    __: NextFunction
  ) {
    if (err instanceof errors.E_VALIDATION_ERROR) {
      this.sendValidationErrors(res, err)
      return
    }

    const statusCode = err instanceof AppError ? err.code : 500
    const message =
      err instanceof AppError ? err.message : 'Something went wrong'

    this._loggerService.error(
      `[StatusCode:${statusCode}] - ${(err as Error | AppError)?.message || 'Something went wrong'}`
    )

    res.status(statusCode).json({ status: 'error', error: message })
  }

  private sendValidationErrors(
    res: Response<ValidationErrorResponseDto>,
    e: InstanceType<typeof errors.E_VALIDATION_ERROR>
  ) {
    const map: Map<string, string> = new Map()

    for (const val of e.messages as { field: string; message: string }[]) {
      map.set(val.field, val.message)
    }

    return res
      .status(400)
      .json({ status: 'error', errors: Object.fromEntries(map) })
  }
}
