import type { CookieOptions, Request, Response } from "express";
import type { Redis } from "ioredis";
import crypto, { type UUID } from "node:crypto";
import { Environment } from "../common/enums/environment.enum.js";
import { BadRequestError, NotFoundError } from "../common/error.js";
import type { HashingService } from "../common/services/hashing.service.js";
import type { LoggerService } from "../common/services/logger.service.js";
import type { ApplicationConfig } from "../config.js";
import {
	REGISTERED_EMAIL_COOKIE_NAME,
	SESSION_COOKIE_NAME,
} from "../const/cookie.js";
import type { ForgotPasswordRequestDto } from "../dto/auth/forgotPassword/forgotPasswordRequest.dto.js";
import type { LoginRequestDto } from "../dto/auth/login/loginRequest.dto.js";
import type { RegisterRequestDto } from "../dto/auth/register/registerRequest.dto.js";
import type { ResetPasswordRequestDto } from "../dto/auth/resetPassword/resetPasswordRequest.dto.js";
import type { SetNewEmailRequestDto } from "../dto/auth/setNewEmail/setNewEmailRequest.dto.js";
import type { VerifyAccountRequestDto } from "../dto/auth/verifyAccount/verifyAccountRequest.dto.js";
import { UserResponseDto } from "../dto/users/userResponse.dto.js";
import type { User } from "../storage/postgres/types/user.types.js";
import type { UsersRepository } from "../storage/postgres/users.repository.js";
import { generateRandomToken } from "../utils/createToken.js";
import { generateUserError } from "../utils/generateUserError.js";
import type { EmailService } from "./email.service.js";

export class AuthService {
	constructor(
		private readonly _applicationConfig: ApplicationConfig,
		private readonly _usersRepository: UsersRepository,
		private readonly _redis: Redis,
		private readonly _hashingService: HashingService,
		private readonly _emailService: EmailService,
	) {
		this.cookieOptions = this.cookieOptions.bind(this);
	}

	async login(
		payload: LoginRequestDto,
		res: Response,
		log: LoggerService,
	): Promise<UserResponseDto> {
		const user = await this._usersRepository.getByKey("email", payload.email);

		log.info(`Authenticating user: ${payload.email}`);

		if (!user || !user.isVerified || user.isBanned) {
			const { message, error } = generateUserError(user, {
				notFoundMessage: "Invalid credentials",
				notFoundCode: 400,
			});

			log.warn({ email: payload.email }, message);
			throw error;
		}

		if (!(await this._hashingService.verify(payload.password, user.password))) {
			log.warn(
				`Failed login attempt for ${payload.email} - Invalid credentials`,
			);
			throw new BadRequestError("Invalid credentials");
		}

		const session = await this.generateSession(user);
		res.cookie(SESSION_COOKIE_NAME, session, this.cookieOptions("login"));

		return new UserResponseDto(user);
	}

	async register(
		payload: RegisterRequestDto,
		res: Response,
		log: LoggerService,
	): Promise<void> {
		const user = await this._usersRepository.getByKey("email", payload.email);

		log.info(`Registering user: ${payload.email}`);

		if (user) {
			log.warn(
				`Failed registration attempt for ${payload.email} - User with email already exists`,
			);
			throw new BadRequestError("User with email already exists");
		}

		const hashedPassword = await this._hashingService.hash(payload.password);
		const token = generateRandomToken();
		const registeredEmailToken = generateRandomToken();

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
				"EX",
				Number(this._applicationConfig.accountVerificationTtlInMinutes) * 60,
			),
			this._redis.set(
				registeredEmailToken,
				payload.email,
				"EX",
				Number(this._applicationConfig.registeredEmailTtlInMinutes) * 60,
			),
		]);

		res.cookie(
			REGISTERED_EMAIL_COOKIE_NAME,
			registeredEmailToken,
			this.cookieOptions("registeredEmail"),
		);
	}

	async logout<T, U, R>(
		req: Request<T, U, R>,
		res: Response,
		log: LoggerService,
	): Promise<void> {
		const userId = req.user?.id;

		log.info({ userId }, "Logging out user");

		const session = req.signedCookies[SESSION_COOKIE_NAME];
		if (!session) {
			log.warn({ userId }, "Session not found");
			throw new BadRequestError("session not found");
		}

		await this._redis.del(session);

		res.clearCookie(SESSION_COOKIE_NAME, this.cookieOptions("logout"));
	}

	async verifyAccount(
		payload: VerifyAccountRequestDto,
		res: Response,
		log: LoggerService,
	): Promise<UserResponseDto> {
		log.info({ token: payload.token }, "Verifying account");

		const email = await this._redis.get(payload.token);
		if (!email) {
			log.warn({ token: payload.token }, "Not found token in redis");
			throw new NotFoundError("Invalid token");
		}

		const [user] = await Promise.all([
			this._usersRepository.updateAndReturn("email", email, {
				isVerified: true,
				updatedAt: new Date(),
			}),
			this._redis.del(payload.token),
		]);

		if (!user) {
			log.warn({ email }, "User not found");
			throw new NotFoundError("User not found");
		}

		const session = await this.generateSession(user);
		res.cookie(SESSION_COOKIE_NAME, session, this.cookieOptions("login"));

		return new UserResponseDto(user);
	}

	async forgotPassword(
		payload: ForgotPasswordRequestDto,
		log: LoggerService,
	): Promise<void> {
		log.info({ email: payload.email }, "Forgot password");

		const user = await this._usersRepository.getByKey("email", payload.email);
		if (!user || !user.isVerified || user.isBanned) {
			const { message, error } = generateUserError(user);

			log.warn({ email: payload.email }, message);
			throw error;
		}

		const token = generateRandomToken();

		await Promise.all([
			this._redis.set(
				token,
				user.id,
				"EX",
				Number(this._applicationConfig.resetPasswordTtlInMinutes) * 60,
			),
			this._emailService.sendResetPasswordEmail(payload.email, token, log),
		]);
	}

	async resetPassword(
		payload: ResetPasswordRequestDto,
		log: LoggerService,
	): Promise<void> {
		log.info({ token: payload.token }, "Reset password");

		const userId = await this._redis.get(payload.token);
		if (!userId) {
			log.warn({ token: payload.token }, "Not found token in redis");
			throw new NotFoundError("Invalid token");
		}

		const hashedPassword = await this._hashingService.hash(payload.password);
		const user = await this._usersRepository.updateAndReturn(
			"id",
			Number(userId),
			{
				password: hashedPassword,
			},
		);

		if (!user) {
			await this._redis.del(payload.token);

			throw new NotFoundError("User not found");
		}

		await this._redis.del(payload.token);
	}

	async sendVerificationEmail(
		token: string,
		log: LoggerService,
	): Promise<void> {
		log.info({ token }, "Sending verification email");

		const email = await this._redis.get(token);
		if (!email) {
			log.warn({ token }, "Not found token in redis");
			throw new NotFoundError("Invalid token");
		}

		const user = await this._usersRepository.getByKey("email", email);
		if (!user || user.isVerified) {
			const message = !user ? "User not found" : "User is already verified";
			log.warn({ email }, message);

			await this._redis.del(token);

			throw !user ? new NotFoundError(message) : new BadRequestError(message);
		}

		const verificationToken = generateRandomToken();

		await Promise.all([
			this._emailService.sendVerificationEmail(email, verificationToken, log),
			this._redis.set(
				verificationToken,
				email,
				"EX",
				Number(this._applicationConfig.accountVerificationTtlInMinutes) * 60,
			),
			this._redis.del(token),
		]);
	}

	async setNewEmail(
		token: string,
		payload: SetNewEmailRequestDto,
		log: LoggerService,
	): Promise<void> {
		log.info({ token }, "Set new email");

		const oldEmail = await this._redis.get(token);
		if (!oldEmail) {
			log.warn({ token }, "Not found token in redis");
			throw new NotFoundError("Invalid token");
		}

		const user = await this._usersRepository.getByKey("email", oldEmail);
		if (!user || user.isVerified) {
			const message = !user ? "User not found" : "User is already verified";
			log.warn({ oldEmail }, message);

			await this._redis.del(token);

			throw !user ? new NotFoundError(message) : new BadRequestError(message);
		}

		const existingUser = await this._usersRepository.getByKey(
			"email",
			payload.newEmail,
		);
		if (existingUser)
			throw new BadRequestError(`User with ${payload.newEmail} already exists`);

		await this._usersRepository.update("email", oldEmail, {
			email: payload.newEmail,
		});

		const verificationToken = generateRandomToken();

		await Promise.all([
			this._emailService.sendVerificationEmail(
				payload.newEmail,
				verificationToken,
				log,
			),
			this._redis.set(
				verificationToken,
				payload.newEmail,
				"EX",
				Number(this._applicationConfig.accountVerificationTtlInMinutes) * 60,
			),
			this._redis.del(token),
		]);
	}

	private async generateSession(user: User): Promise<UUID> {
		const uuid = crypto.randomUUID();

		await this._redis.set(
			uuid,
			user.id,
			"EX",
			Number(this._applicationConfig.sessionTtlInMinutes) * 60,
		);

		return uuid;
	}

	private cookieOptions(
		type: "login" | "logout" | "registeredEmail",
	): CookieOptions {
		const cookie: CookieOptions = {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: this._applicationConfig.environment === Environment.Production,
			signed: true,
			maxAge:
				Number(
					type === "login"
						? this._applicationConfig.sessionTtlInMinutes
						: type === "logout"
							? 0
							: this._applicationConfig.registeredEmailTtlInMinutes,
				) * 60000,
		};

		return cookie;
	}
}
