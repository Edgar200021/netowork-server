import vine from "@vinejs/vine";
import type { Request, Response } from "express";
import { SuccessResponseDto } from "../common/dto/base.dto.js";
import { NotFoundError, UnauthorizedError } from "../common/error.js";
import { REGISTERED_EMAIL_COOKIE_NAME } from "../const/cookie.js";
import {
	type ForgotPasswordRequestDto,
	forgotPasswordSchema,
} from "../dto/auth/forgotPassword/forgotPasswordRequest.dto.js";
import type { ForgotPasswordResponseDto } from "../dto/auth/forgotPassword/forgotPasswordResponse.dto.js";
import {
	type LoginRequestDto,
	loginSchema,
} from "../dto/auth/login/loginRequest.dto.js";
import type { LoginResponseDto } from "../dto/auth/login/loginResponse.dto.js";
import type { LogoutResponseDto } from "../dto/auth/logout/logoutResponse.dto.js";
import {
	type RegisterRequestDto,
	registerSchema,
} from "../dto/auth/register/registerRequest.dto.js";
import type { RegisterResponseDto } from "../dto/auth/register/registerResponse.dto.js";
import {
	type ResetPasswordRequestDto,
	resetPasswordSchema,
} from "../dto/auth/resetPassword/resetPasswordRequest.dto.js";
import type { ResetPasswordResponseDto } from "../dto/auth/resetPassword/resetPasswordResponse.dto.js";
import type { SendVerificationEmailResponseDto } from "../dto/auth/sendVerificationEmail/sendVerificationEmailResponse.dto.js";
import {
	type SetNewEmailRequestDto,
	setNewEmailSchema,
} from "../dto/auth/setNewEmail/setNewEmailRequest.dto.js";
import type { SetNewEmailResponseDto } from "../dto/auth/setNewEmail/setNewEmailResponse.dto.js";
import {
	type VerifyAccountRequestDto,
	verifyAccountSchema,
} from "../dto/auth/verifyAccount/verifyAccountRequest.dto.js";
import type { VerifyAccountResponseDto } from "../dto/auth/verifyAccount/verifyAccountResponse.dto.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { AuthService } from "../services/auth.service.js";
import { asyncWrapper } from "../utils/handlerAsyncWrapper.js";
import { BaseHandler } from "./base.handler.js";

export class AuthHandler extends BaseHandler {
	protected readonly validators = {
		login: vine.compile(loginSchema),
		register: vine.compile(registerSchema),
		verifyAccount: vine.compile(verifyAccountSchema),
		forgotPassword: vine.compile(forgotPasswordSchema),
		resetPassword: vine.compile(resetPasswordSchema),
		setNewEmail: vine.compile(setNewEmailSchema),
	};

	constructor(
		private readonly _authService: AuthService,
		private readonly _middlewares: Middlewares,
	) {
		super();
		this.bindMethods();
		this.setupRoutes();
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
		res: Response<LoginResponseDto>,
	) {
		const user = await this._authService.login(req.body, res, req.logger);

		res.status(200).json(new SuccessResponseDto(user));
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
		res: Response<RegisterResponseDto>,
	) {
		await this._authService.register(req.body, res, req.logger);

		res
			.status(201)
			.json(
				new SuccessResponseDto(
					"Message for verification has been sent to your email address",
				),
			);
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
		res: Response<VerifyAccountResponseDto>,
	) {
		const user = await this._authService.verifyAccount(
			req.body,
			res,
			req.logger,
		);

		res.status(200).json(new SuccessResponseDto(user));
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
	 *       - Session: []
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
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		await this._authService.logout(req, res, req.logger);

		res.status(200).json(new SuccessResponseDto("Logout successful"));
	}

	/**
	 * @openapi
	 * /api/v1/auth/forgot-password:
	 *   post:
	 *     tags:
	 *       - Authentication
	 *     summary: Forgot Password
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ForgotPasswordRequestDto'
	 *     responses:
	 *       200:
	 *         description: Email with password reset instructions has been sent to your email
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ForgotPasswordResponseDto'
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
	 */
	async forgotPassword(
		req: Request<unknown, ForgotPasswordResponseDto, ForgotPasswordRequestDto>,
		res: Response<ForgotPasswordResponseDto>,
	) {
		await this._authService.forgotPassword(req.body, req.logger);
		res
			.status(200)
			.json(
				new SuccessResponseDto(
					"Email with password reset instructions has been sent to your email",
				),
			);
	}

	/**
	 * @openapi
	 * /api/v1/auth/reset-password:
	 *   patch:
	 *     tags:
	 *       - Authentication
	 *     summary: Reset Password
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ResetPasswordRequestDto'
	 *     responses:
	 *       200:
	 *         description: Password reset successful
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ResetPasswordResponseDto'
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
	 *                     password: "Password must be at least 8 characters"
	 *
	 */
	async resetPassword(
		req: Request<unknown, ResetPasswordResponseDto, ResetPasswordRequestDto>,
		res: Response<ResetPasswordResponseDto>,
	) {
		await this._authService.resetPassword(req.body, req.logger);

		res.status(200).json(new SuccessResponseDto("Password reset successful"));
	}

	/**
	 * @openapi
	 * /api/v1/auth/send-verification-email:
	 *   post:
	 *     tags:
	 *       - Authentication
	 *     summary: Send Verification Email
	 *     responses:
	 *       200:
	 *         description: Verification email sent successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SendVerificationEmailResponseDto'
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
	 */
	async sendVerificationEmail(
		req: Request<unknown, SendVerificationEmailResponseDto>,
		res: Response<SendVerificationEmailResponseDto>,
	) {
		const token = req.signedCookies[REGISTERED_EMAIL_COOKIE_NAME];
		if (!token) throw new NotFoundError("Token not found");

		await this._authService.sendVerificationEmail(token, req.logger);

		res
			.status(200)
			.json(new SuccessResponseDto("Verification email sent successfully"));
	}

	async setNewEmail(
		req: Request<unknown, SetNewEmailResponseDto, SetNewEmailRequestDto>,
		res: Response<SetNewEmailResponseDto>,
	) {
		const token = req.signedCookies[REGISTERED_EMAIL_COOKIE_NAME];
		if (!token) throw new NotFoundError("Token not found");

		await this._authService.setNewEmail(token, req.body, req.logger);

		res
			.status(200)
			.json(
				new SuccessResponseDto(
					"Email updated and verification email sent successfully",
				),
			);
	}

	protected bindMethods() {
		this.login = this.login.bind(this);
		this.register = this.register.bind(this);
		this.logout = this.logout.bind(this);
		this.verifyAccount = this.verifyAccount.bind(this);
		this.forgotPassword = this.forgotPassword.bind(this);
		this.resetPassword = this.resetPassword.bind(this);
		this.sendVerificationEmail = this.sendVerificationEmail.bind(this);
		this.setNewEmail = this.setNewEmail.bind(this);
	}

	protected setupRoutes() {
		this._router.post(
			"/login",
			this._middlewares.validateRequest([{
				validatorOrSchema: this.validators.login,
				type: "body",
			}]),
			asyncWrapper(this.login),
		);

		this._router.post(
			"/register",
			this._middlewares.validateRequest([{
				validatorOrSchema: this.validators.register,
				type: "body",
			}]),
			asyncWrapper(this.register),
		);

		this._router.patch(
			"/account-verification",
			this._middlewares.validateRequest([{
				validatorOrSchema: this.validators.verifyAccount,
				type: "body",
			}]),
			asyncWrapper(this.verifyAccount),
		);

		this._router.post(
			"/forgot-password",
			this._middlewares.validateRequest([{
				validatorOrSchema: this.validators.forgotPassword,
				type: "body",
			}]),
			asyncWrapper(this.forgotPassword),
		);

		this._router.patch(
			"/reset-password",
			this._middlewares.validateRequest([{
				validatorOrSchema: this.validators.resetPassword,
				type: "body",
			}]),
			asyncWrapper(this.resetPassword),
		);

		this._router.post(
			"/send-verification-email",
			asyncWrapper(this.sendVerificationEmail),
		);

		this._router.patch(
			"/set-new-email-address",
			this._middlewares.validateRequest([{
				validatorOrSchema: this.validators.setNewEmail,
				type: "body",
			}]),
			asyncWrapper(this.setNewEmail),
		);

		this._router.post(
			"/logout",
			this._middlewares.auth,
			asyncWrapper(this.logout),
		);
	}
}
