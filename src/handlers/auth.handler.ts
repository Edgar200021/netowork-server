import type { Express, Request, Response } from 'express'
import {
  type LoginRequestDto,
  loginSchema,
} from '../dto/auth/login/login-request.dto.js'
import type { LoginResponseDto } from '../dto/auth/login/login-response.dto.js'
import {
  RegisterRequestDto,
  registerSchema,
} from '../dto/auth/register/register-request.dto.js'
import type { RegisterResponseDto } from '../dto/auth/register/register-response.dto.js'
import type { Middlewares } from '../middlewares/middlewars.js'
import type { AuthService } from '../services/auth.service.js'
import { asyncWrapper } from '../utils/handlerAsyncWrapper.js'

export class AuthHandler {
  private static _instance: AuthHandler | null = null

  constructor(
    private readonly _app: Express,
    private readonly _authService: AuthService,
    middlewares: Middlewares
  ) {
    if (AuthHandler._instance) return AuthHandler._instance
    AuthHandler._instance = this

    this.login = this.login.bind(this)
    this.register = this.register.bind(this)

    _app.post(
      '/auth/login',
      middlewares.validateRequest(loginSchema),
      asyncWrapper(this.login)
    )

    _app.post(
      '/auth/register',
      middlewares.validateRequest(registerSchema),
      asyncWrapper(this.register)
    )
  }

  async login(
    req: Request<unknown, LoginResponseDto, LoginRequestDto>,
    res: Response<LoginResponseDto>
  ) {
    const user = await this._authService.login(req.body)

    res.status(200).json({ status: 'success', data: user })
  }

  async register(
    req: Request<unknown, RegisterResponseDto, RegisterRequestDto>,
    res: Response<RegisterResponseDto>
  ) {
    await this._authService.register(req.body)

    res.status(201).json({
      status: 'success',
      data: 'Message for verification has been sent to your email address',
    })
  }
}
