import vine, { VineValidator, errors } from '@vinejs/vine'
import type { SchemaTypes } from '@vinejs/vine/types'
import type { NextFunction, Request, Response } from 'express'
import type { Redis } from 'ioredis'
import { randomUUID } from 'node:crypto'
import type {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/base.dto.js'
import {
  AppError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from '../common/error.js'
import type { LoggerService } from '../common/services/logger.service.js'
import type { ApplicationConfig } from '../config.js'
import { SESSION_COOKIE_NAME } from '../const/cookie.js'
import type { UserRole } from '../storage/db.js'
import type { UsersRepository } from '../storage/postgres/users.repository.js'

export class Middlewares {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _redis: Redis,
    private readonly _logger: LoggerService,
    private readonly _applicationConfig: ApplicationConfig
  ) {
    this.handleErrors = this.handleErrors.bind(this)
    this.sendValidationErrors = this.sendValidationErrors.bind(this)
    this.auth = this.auth.bind(this)
    this.requestLogger = this.requestLogger.bind(this)
  }

  async auth(req: Request, res: Response, next: NextFunction) {
    const log = req.logger

    log.info('Authenticating user')

    const session = req.signedCookies[SESSION_COOKIE_NAME]
    if (!session) {
      log.warn('Session not found in cookies')
      return next(new UnauthorizedError('Unauthorized'))
    }

    try {
      const userId = await this._redis.getex(
        session,
        'EX',
        Number(this._applicationConfig.sessionTtlInMinutes) * 60
      )

      if (!userId) {
        log.warn({ sessionId: session }, 'Session not found in redis')
        throw new UnauthorizedError('Unauthorized')
      }

      const user = await this._usersRepository.getByKey('id', Number(userId))

      if (!user) {
        log.warn({ userId, sessionId: session }, 'User not found')
        await this._redis.del(session)
        throw new UnauthorizedError("User doesn't exist")
      }

      req.user = user
      next()
    } catch (error) {
      log.error(
        {
          sessionId: session,
          error: error instanceof Error ? error.message : error,
        },
        'Unexpected authentication error'
      )
      next(new InternalServerError('Something went wrong while authenticating'))
    }
  }

  restrict(roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const log = req.logger

      log.info({ roles }, 'Restricting access')

      if (!req.user) {
        return next(new UnauthorizedError('Unauthorized'))
      }

      if (roles.indexOf(req.user.role) === -1) {
		log.warn({user: req.user}, "Does not have permission to perform this action")
        return next(
          new ForbiddenError("You don't have permission to perform this action")
        )
	}

      return next()
    }
  }

  validateRequest(
    validatorOrSchema: VineValidator<SchemaTypes, undefined> | SchemaTypes
  ): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, _: Response, next: NextFunction) => {
      try {
        if (validatorOrSchema instanceof VineValidator) {
          await validatorOrSchema.validate(req.body, {
            meta: undefined,
          })

          return next()
        }

        await vine.validate({
          schema: validatorOrSchema,
          data: req.body,
        })
        next()
      } catch (error) {
        next(error)
      }
    }
  }

  requestLogger(req: Request, res: Response, next: NextFunction) {
    const reqId = randomUUID().toString()
    const logger = this._logger.child({ reqId })

    logger.info(`Incoming request: ${req.method} ${req.url}`)

    req.logger = logger

    next()
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

    if (err instanceof AppError) {
      res.status(err.code).json({ status: 'error', error: err.message })
      return
    }

    this._logger.error(
      `[Unhandled Error] ${err instanceof Error ? err.stack : String(err)}`
    )

    res.status(500).json({ status: 'error', error: 'Something went wrong' })
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
