import type { CookieOptions, Request, Response } from 'express'
import type { Redis } from 'ioredis'
import crypto, { type UUID } from 'node:crypto'
import { Environment } from '../common/enums/environment.enum.js'
import { BadRequestError, NotFoundError } from '../common/error.js'
import type { HashingService } from '../common/services/hashing.service.js'
import type { LoggerService } from '../common/services/logger.service.js'
import type { ApplicationConfig } from '../config.js'
import { SESSION_COOKIE_NAME } from '../const/cookie.js'
import type { LoginRequestDto } from '../dto/auth/login/login-request.dto.js'
import type { RegisterRequestDto } from '../dto/auth/register/register-request.dto.js'
import { UserResponseDto } from '../dto/users/user-response.dto.js'
import type { User } from '../storage/postgres/types/user.types.js'
import type { UsersRepository } from '../storage/postgres/users.repository.js'

export class AuthService {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _redis: Redis,
    private readonly _loggerService: LoggerService,
    private readonly _hashingService: HashingService,
    private readonly _applicationConfig: ApplicationConfig
  ) {
    this.cookieOptions = this.cookieOptions.bind(this)
  }

  async login(
    payload: LoginRequestDto,
    res: Response
  ): Promise<UserResponseDto> {
    const user = await this._usersRepository.getByKey('email', payload.email)

    if (!user)
      throw new NotFoundError(`User with ${payload.email} doesn't exist`)

    if (!(await this._hashingService.verify(payload.password, user.password)))
      throw new BadRequestError('Invalid credentials')

    const session = await this.generateSession(user)
    res.cookie(SESSION_COOKIE_NAME, session, this.cookieOptions('login'))

    return new UserResponseDto(user)
  }

  async register(payload: RegisterRequestDto): Promise<void> {
    const user = await this._usersRepository.getByKey('email', payload.email)

    if (user) throw new BadRequestError('User with email already exists')

    const hashedPassword = await this._hashingService.hash(payload.password)

    await this._usersRepository.create({
      email: payload.email,
      password: hashedPassword,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
    })
  }

  async logout(req: Request, res: Response) {
    const session = req.signedCookies[SESSION_COOKIE_NAME]
    if (!session) throw new BadRequestError('session not found')

    await this._redis.del(session)

    res.clearCookie(SESSION_COOKIE_NAME, this.cookieOptions('logout'))
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
