import vine, { VineValidator, errors } from "@vinejs/vine";
import type { SchemaTypes } from "@vinejs/vine/types";
import type { NextFunction, Request, Response } from "express";
import { type Multer, MulterError } from "multer";
import { randomUUID } from "node:crypto";
import {
	ErrorResponseDto,
	ValidationErrorResponseDto,
} from "../common/dto/base.dto.js";
import {
	AppError,
	BadRequestError,
	ForbiddenError,
	UnauthorizedError,
} from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import type { ApplicationConfig } from "../config.js";
import { SESSION_COOKIE_NAME } from "../const/cookie.js";
import { INVALID_FILENAME_ERROR_CODE } from "../const/multer.js";
import type { UserRole } from "../storage/db.js";
import type { Database } from "../storage/postgres/database.js";
import type { Redis } from "../storage/redis/redis.js";
import type { NonEmptyArray } from "../types/common.js";
import type { AllowedMimeTypesValues } from "../types/mimeTypes.js";
import { generateUserError } from "../utils/generateUserError.js";

export class Middlewares {
	constructor(
		private readonly _database: Database,
		private readonly _redis: Redis,
		private readonly _multer: Multer,
		private readonly _logger: LoggerService,
		private readonly _applicationConfig: ApplicationConfig,
	) {
		this.handleErrors = this.handleErrors.bind(this);
		this.sendValidationErrors = this.sendValidationErrors.bind(this);
		this.auth = this.auth.bind(this);
		this.requestLogger = this.requestLogger.bind(this);
	}

	async auth(req: Request, res: Response, next: NextFunction) {
		const log = req.logger;

		log.info("Authenticating user");

		const session = req.signedCookies[SESSION_COOKIE_NAME];
		if (!session) {
			log.warn("Session not found in cookies");
			return next(new UnauthorizedError("Unauthorized"));
		}

		const userId = await this._redis.getex(
			session,
			"EX",
			Number(this._applicationConfig.sessionTtlInMinutes) * 60,
		);

		if (!userId) {
			log.warn({ sessionId: session }, "Session not found in redis");
			return next(new UnauthorizedError("Unauthorized"));
		}

		const user = await this._database
			.selectFrom("users")
			.selectAll()
			.where("id", "=",userId)
			.executeTakeFirst();

		if (!user || !user.isVerified || user.isBanned) {
			const { message, error } = generateUserError(user);

			log.warn({ userId, sessionId: session }, message);

			await this._redis.del(session);
			return next(error);
		}

		req.user = user;
		next();
	}

	restrict(roles: UserRole[]) {
		return (req: Request, res: Response, next: NextFunction) => {
			const log = req.logger;

			log.info({ roles }, "Restricting access");

			if (!req.user) {
				return next(new UnauthorizedError("Unauthorized"));
			}

			if (roles.indexOf(req.user.role) === -1) {
				log.warn(
					{ email: req.user.email, role: req.user.role },
					"Does not have permission to perform this action",
				);
				return next(
					new ForbiddenError(
						"You don't have permission to perform this action",
					),
				);
			}

			return next();
		};
	}

	validateRequest(
		validators: {
			validatorOrSchema: VineValidator<SchemaTypes, undefined> | SchemaTypes;
			type: keyof Pick<Request, "query" | "body" | "params">;
		}[],
	): (req: Request, res: Response, next: NextFunction) => void {
		return async (req: Request, _: Response, next: NextFunction) => {
			try {
				for (const { validatorOrSchema, type } of validators) {
					validatorOrSchema instanceof VineValidator
						? await validatorOrSchema.validate(req[type], {
								meta: undefined,
							})
						: await vine.validate({
								schema: validatorOrSchema,
								data: req[type],
							});
				}

				return next();
			} catch (error) {
				next(error);
			}
		};
	}

	requestLogger(req: Request, res: Response, next: NextFunction) {
		const reqId = randomUUID().toString();
		const logger = this._logger.child({ reqId });

		logger.info(`Incoming request: ${req.method} ${req.url}`);

		req.logger = logger;

		next();
	}

	uploadFile(
		name: string,
		{
			single,
			mimeTypes,
			fileCount,
		}: {
			single: boolean;
			mimeTypes?: NonEmptyArray<AllowedMimeTypesValues>;
			fileCount?: number;
		},
	) {
		return (req: Request, res: Response, next: NextFunction) => {
			const upload = this._multer[single ? "single" : "array"](
				name,
				fileCount ?? 1,
			);

			upload(req, res, (err) => {
				if (err) {
					if (
						err instanceof MulterError &&
						err.code === INVALID_FILENAME_ERROR_CODE
					) {
						return next(new BadRequestError("Invalid field name"));
					}

					return next(err);
				}

				if (
					single &&
					req.file &&
					mimeTypes &&
					!mimeTypes.includes(req.file.mimetype as AllowedMimeTypesValues)
				) {
					return next(new BadRequestError("Invalid file type"));
				}

				if (!single && req.files && mimeTypes) {
					const files = Array.isArray(req.files) ? req.files : req.files[name];

					if (
						files.length > 0 &&
						!files.every((f) =>
							mimeTypes.includes(f.mimetype as AllowedMimeTypesValues),
						)
					)
						return next(new BadRequestError("Invalid file type"));
				}

				next();
			});
		};
	}

	handleErrors(
		err: unknown,
		_: Request,
		res: Response<ErrorResponseDto | ValidationErrorResponseDto>,
		__: NextFunction,
	) {
		if (err instanceof errors.E_VALIDATION_ERROR) {
			this.sendValidationErrors(res, err);
			return;
		}

		if (err instanceof AppError) {
			res.status(err.code).json(new ErrorResponseDto(err.message));
			return;
		}

		this._logger.error(
			`[Unhandled Error] ${err instanceof Error ? err.stack : String(err)}`,
		);

		res.status(500).json(new ErrorResponseDto("Something went wrong"));
	}

	private sendValidationErrors(
		res: Response<ValidationErrorResponseDto>,
		e: InstanceType<typeof errors.E_VALIDATION_ERROR>,
	) {
		const map: Map<string, string> = new Map();

		for (const val of e.messages as { field: string; message: string }[]) {
			map.set(val.field, val.message);
		}

		return res
			.status(400)
			.json(new ValidationErrorResponseDto(Object.fromEntries(map)));
	}
}
