import vine from '@vinejs/vine'
import type { Express, Request, Response } from 'express'
import { UnauthorizedError } from '../common/error.js'
import {
  type LoginRequestDto,
  loginSchema,
} from '../dto/auth/login/login-request.dto.js'
import type { LoginResponseDto } from '../dto/auth/login/login-response.dto.js'
import type { LogoutResponseDto } from '../dto/auth/logout/logout-response.dto.js'
import {
  type RegisterRequestDto,
  registerSchema,
} from '../dto/auth/register/register-request.dto.js'
import type { RegisterResponseDto } from '../dto/auth/register/register-response.dto.js'
import type { Middlewares } from '../middlewares/middlewares.js'
import type { AuthService } from '../services/auth.service.js'
import { asyncWrapper } from '../utils/handlerAsyncWrapper.js'

export class AuthHandler {
  private readonly validators = {
    login: vine.compile(loginSchema),
    register: vine.compile(registerSchema),
  }

  constructor(
    private readonly _app: Express,
    private readonly _authService: AuthService,
    private readonly _middlewares: Middlewares
  ) {
    this.bindMethods()
    this.setupRoutes()
  }

  async login(
    req: Request<unknown, LoginResponseDto, LoginRequestDto>,
    res: Response<LoginResponseDto>
  ) {
    const user = await this._authService.login(req.body, res)

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

  async logout(req: Request, res: Response<LogoutResponseDto>) {
    if (!req.user) throw new UnauthorizedError('Unauthorized')

    await this._authService.logout(req, res)

    res.status(200).json({ status: 'success', data: 'Logout successful' })
  }

  private bindMethods() {
    this.login = this.login.bind(this)
    this.register = this.register.bind(this)
    this.logout = this.logout.bind(this)
  }

  private setupRoutes() {
    this._app.post(
      '/auth/login',
      this._middlewares.validateRequest(this.validators.login),
      asyncWrapper(this.login)
    )

    this._app.post(
      '/auth/register',
      this._middlewares.validateRequest(this.validators.register),
      asyncWrapper(this.register)
    )

    this._app.post(
      '/auth/logout',
      this._middlewares.auth,
      asyncWrapper(this.logout)
    )
  }
}
