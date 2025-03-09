import {
  BadRequestError,
  InvalidCredentialsError,
  NotFoundError,
} from '../common/error.js'
import type { HashingService } from '../common/services/hashing.service.js'
import type { LoggerService } from '../common/services/logger.service.js'
import type { LoginRequestDto } from '../dto/auth/login/login-request.dto.js'
import type { RegisterRequestDto } from '../dto/auth/register/register-request.dto.js'
import { UserResponseDto } from '../dto/users/user-response.dto.js'
import type { UsersRepository } from '../storage/postgres/users.repository.js'

export class AuthService {
  static _instance: null | AuthService = null

  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _loggerService: LoggerService,
    private readonly _hashingService: HashingService
  ) {
    if (AuthService._instance) return AuthService._instance
    AuthService._instance = this
  }

  async login(payload: LoginRequestDto): Promise<UserResponseDto> {
    const user = await this._usersRepository.getByKey('email', payload.email)

    if (!user)
      throw new NotFoundError(`User with ${payload.email} doesn't exist`)

    if (!(await this._hashingService.verify(payload.password, user.password)))
      throw new InvalidCredentialsError('Invalid credentials')

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
}
