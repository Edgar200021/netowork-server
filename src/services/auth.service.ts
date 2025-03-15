import type { CookieOptions, Request, Response } from 'express'
import type { Redis } from 'ioredis'
import crypto, { type UUID } from 'node:crypto'
import { Environment } from '../common/enums/environment.enum.js'
import { AppError, BadRequestError, NotFoundError } from '../common/error.js'
import type { EmailService } from '../common/services/email.service.js'
import type { HashingService } from '../common/services/hashing.service.js'
import type { LoggerService } from '../common/services/logger.service.js'
import type { ApplicationConfig } from '../config.js'
import { SESSION_COOKIE_NAME } from '../const/cookie.js'
import type { LoginRequestDto } from '../dto/auth/login/loginRequest.dto.js'
import type { RegisterRequestDto } from '../dto/auth/register/registerRequest.dto.js'
import type { VerifyAccountRequestDto } from '../dto/auth/verifyAccount/verifyAccountRequest.dto.js'
import { UserResponseDto } from '../dto/users/userResponse.dto.js'
import type { User } from '../storage/postgres/types/user.types.js'
import type { UsersRepository } from '../storage/postgres/users.repository.js'
import { generateRandomToken } from '../utils/createToken.js'

export class AuthService {
  constructor(
    private readonly _applicationConfig: ApplicationConfig,
    private readonly _usersRepository: UsersRepository,
    private readonly _redis: Redis,
    private readonly _logger: LoggerService,
    private readonly _hashingService: HashingService,
    private readonly _emailService: EmailService
  ) {
    this.cookieOptions = this.cookieOptions.bind(this)
  }

  async login(
    payload: LoginRequestDto,
    res: Response,
    logger?: LoggerService
  ): Promise<UserResponseDto> {
    const log = logger ?? this._logger
    const user = await this._usersRepository.getByKey('email', payload.email)

    log.info(`Authenticating user: ${payload.email}`)

    if (!user || !user.isVerified || user.isBanned) {
      const message = !user
        ? 'Invalid credentials'
        : !user.isVerified
          ? 'User is not verified'
          : 'User is banned'
      const code = !user || !user.isVerified ? 400 : 403

      throw new AppError(message, code)
    }

    if (!(await this._hashingService.verify(payload.password, user.password))) {
      log.warn(
        `Failed login attempt for ${payload.email} - Invalid credentials`
      )
      throw new BadRequestError('Invalid credentials')
    }

    const session = await this.generateSession(user)
    res.cookie(SESSION_COOKIE_NAME, session, this.cookieOptions('login'))

    return new UserResponseDto(user)
  }

  async register(
    payload: RegisterRequestDto,
    logger?: LoggerService
  ): Promise<void> {
    const log = logger ?? this._logger
    const user = await this._usersRepository.getByKey('email', payload.email)

    log.info(`Registering user: ${payload.email}`)

    if (user) {
      log.warn(
        `Failed registration attempt for ${payload.email} - User with email already exists`
      )
      throw new BadRequestError('User with email already exists')
    }

    const hashedPassword = await this._hashingService.hash(payload.password)
    const token = generateRandomToken()

    await Promise.all([
      this._usersRepository.create({
        email: payload.email,
        password: hashedPassword,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
      }),
      this._emailService.sendVerificationEmail(payload.email, token, log),
      this._redis.set(
        token,
        payload.email,
        'EX',
        Number(this._applicationConfig.sessionTtlInMinutes) * 60
      ),
    ])
  }

  async logout(
    req: Request,
    res: Response,
    logger?: LoggerService
  ): Promise<void> {
    const log = logger ?? this._logger
    const userId = req.user?.id

    log.info({ userId }, 'Logging out user')

    const session = req.signedCookies[SESSION_COOKIE_NAME]
    if (!session) {
      log.warn({ userId }, 'Session not found')
      throw new BadRequestError('session not found')
    }

    await this._redis.del(session)

    res.clearCookie(SESSION_COOKIE_NAME, this.cookieOptions('logout'))
  }

  async verifYAccount(
    payload: VerifyAccountRequestDto,
    logger?: LoggerService
  ): Promise<UserResponseDto> {
    const log = logger ?? this._logger

    log.info({ token: payload.token }, 'Verifying account')

    const email = await this._redis.get(payload.token)
    if (!email) {
      log.warn({ token: payload.token }, 'Not found token in redis')
      throw new NotFoundError('Invalid token')
    }

    const [user] = await Promise.all([
      this._usersRepository.updateAndReturn('email', email, {
        isVerified: true,
        updatedAt: new Date(),
      }),
      this._redis.del(payload.token),
    ])

    if (!user) {
      log.warn({ email }, 'User not found')
      throw new NotFoundError('User not found')
    }

    return new UserResponseDto(user)
  }

  private async generateSession(user: User): Promise<UUID> {
    const uuid = crypto.randomUUID()

    await this._redis.set(
      uuid,
      user.id,
      'EX',
      Number(this._applicationConfig.sessionTtlInMinutes) * 60
    )

    return uuid
  }

  private cookieOptions(type: 'login' | 'logout'): CookieOptions {
    if (type === 'login')
      return {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: this._applicationConfig.environment === Environment.Production,
        signed: true,
        maxAge: Number(this._applicationConfig.sessionTtlInMinutes) * 60000,
      }

    return {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: this._applicationConfig.environment === Environment.Production,
      signed: true,
      maxAge: 0,
    }
  }
}
