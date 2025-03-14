import vine from '@vinejs/vine'
import type { Request, Response } from 'express'
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
} from '../dto/auth/register/registerRequest.dto.js'
import type { RegisterResponseDto } from '../dto/auth/register/registerResponse.dt.js'
import {
  type VerifyAccountRequestDto,
  verifyAccountSchema,
} from '../dto/auth/verifyAccount/verifyAccountRequest.dto.js'
import type { VerifyAccountResponseDto } from '../dto/auth/verifyAccount/verifyAccountResponse.dto.js'
import type { Middlewares } from '../middlewares/middlewares.js'
import type { AuthService } from '../services/auth.service.js'
import { asyncWrapper } from '../utils/handlerAsyncWrapper.js'
import { BaseHandler } from './base.handler.js'

export class AuthHandler extends BaseHandler {
  private readonly validators = {
    login: vine.compile(loginSchema),
    register: vine.compile(registerSchema),
    verifyAccount: vine.compile(verifyAccountSchema),
  }

  constructor(
    private readonly _authService: AuthService,
    private readonly _middlewares: Middlewares
  ) {
    super()
    this.bindMethods()
    this.setupRoutes()
  }

  /**
   * @openapi
   * /api/v1/auth/login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Login
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequestDto'
   *     responses:
   *       200:
   *         description: Login successful
   *         headers:
   *           Set-Cookie:
   *             description: HTTP-only session cookie
   *             schema:
   *               type: string
   *               example: "session=abcdef123456; HttpOnly; Path=/; Max-Age=3600; Secure"
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponseDto'
   *       400:
   *         description: Bad request or validation error
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/ErrorResponseDto'
   *                 - $ref: '#/components/schemas/ValidationErrorResponseDto'
   *             examples:
   *               BadRequest:
   *                 summary: Bad request error
   *                 value:
   *                   status: "error"
   *                   error: "Invalid request format"
   *               ValidationError:
   *                 summary: Validation error
   *                 value:
   *                   status: "error"
   *                   errors:
   *                     email: "Email is not valid"
   *                     password: "Password must be at least 8 characters"
   */
  async login(
    req: Request<unknown, LoginResponseDto, LoginRequestDto>,
    res: Response<LoginResponseDto>
  ) {
    const user = await this._authService.login(req.body, res)

    res.status(200).json({ status: 'success', data: user })
  }

  /**
   * @openapi
   * /api/v1/auth/register:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Register
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequestDto'
   *     responses:
   *       201:
   *         description: Registration successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RegisterResponseDto'
   *       400:
   *         description: Bad request or validation error
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/ErrorResponseDto'
   *                 - $ref: '#/components/schemas/ValidationErrorResponseDto'
   *             examples:
   *               BadRequest:
   *                 summary: General error
   *                 value:
   *                   status: "error"
   *                   error: "Invalid request format"
   *               ValidationError:
   *                 summary: Validation error
   *                 value:
   *                   status: "error"
   *                   errors:
   *                     email: "Email is already in use"
   *                     password: "Password must be at least 8 characters"
   */
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

  /**
   * @openapi
   * /api/v1/auth/verify-account:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Account Verification
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/VerifyAccountRequestDto'
   *     responses:
   *       200:
   *         description: Account verification successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VerifyAccountResponseDto'
   *       400:
   *         description: Bad request or validation error
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/ErrorResponseDto'
   *                 - $ref: '#/components/schemas/ValidationErrorResponseDto'
   *             examples:
   *               BadRequest:
   *                 summary: Bad request error
   *                 value:
   *                   status: "error"
   *                   error: "Invalid request format"
   *               ValidationError:
   *                 summary: Validation error
   *                 value:
   *                   status: "error"
   *                   errors:
   *                     token: "Token is not valid"
   */
  async verifyAccount(
    req: Request<unknown, VerifyAccountResponseDto, VerifyAccountRequestDto>,
    res: Response<VerifyAccountResponseDto>
  ) {
    const user = await this._authService.verifYAccount(req.body)

    res.status(200).json({ status: 'success', data: user })
  }

  /**
   * @openapi
   * /api/v1/auth/logout:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Logout
   *     description: Logs out the user by clearing the session cookie.
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LogoutResponseDto'
   *       401:
   *         description: Unauthorized (User is not logged in)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponseDto'
   *     cookies:
   *       session:
   *         description: Session token used for authentication.
   *         required: true
   *         schema:
   *           type: string
   */
  async logout(req: Request, res: Response<LogoutResponseDto>) {
    if (!req.user) throw new UnauthorizedError('Unauthorized')

    await this._authService.logout(req, res)

    res.status(200).json({ status: 'success', data: 'Logout successful' })
  }

  private bindMethods() {
    this.login = this.login.bind(this)
    this.register = this.register.bind(this)
    this.logout = this.logout.bind(this)
    this.verifyAccount = this.verifyAccount.bind(this)
  }

  private setupRoutes() {
    this._router.post(
      '/login',
      this._middlewares.validateRequest(this.validators.login),
      asyncWrapper(this.login)
    )

    this._router.post(
      '/register',
      this._middlewares.validateRequest(this.validators.register),
      asyncWrapper(this.register)
    )

    this._router.patch(
      '/account-verification',
      this._middlewares.validateRequest(this.validators.verifyAccount),
      asyncWrapper(this.verifyAccount)
    )

    this._router.post(
      '/logout',
      this._middlewares.auth,
      asyncWrapper(this.logout)
    )
  }

  router() {
    return this._router
  }
}
