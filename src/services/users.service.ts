import type { Request, Response } from "express";
import { BadRequestError, UnauthorizedError } from "../common/error.js";
import type { HashingService } from "../common/services/hashing.service.js";
import type { ApplicationConfig } from "../config.js";
import type { ChangeProfilePasswordRequestDto } from "../dto/users/changeProfilePassword/changeProfilePasswordRequest.dto.js";
import type { UpdateProfileRequestDto } from "../dto/users/updateProfile/updateProfileRequest.dto.js";
import type { UpdateProfileResponseDto } from "../dto/users/updateProfile/updateProfileResponse.dto.js";
import type { Database } from "../storage/postgres/database.js";
import type { User } from "../storage/postgres/types/user.types.js";
import type { Redis } from "../storage/redis/redis.js";
import type { FileUploadResponse } from "../types/cloudinary.js";
import { generateRandomToken } from "../utils/createToken.js";
import type { AuthService } from "./auth.service.js";
import type { EmailService } from "./email.service.js";
import type { FileUploader } from "./fileUploader.service.js";

export class UsersService {
	constructor(
		private readonly _database: Database,
		private readonly _hashingService: HashingService,
		private readonly _authService: AuthService,
		private readonly _emailService: EmailService,
		private readonly _redis: Redis,
		private readonly _imageUploader: FileUploader,
		private readonly _applicationConfig: ApplicationConfig,
	) {}

	async updateProfile(
		req: Request<unknown, UpdateProfileResponseDto, UpdateProfileRequestDto>,
		res: Response,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		if (Object.keys(req.body).length === 0 && !req.file) {
			throw new BadRequestError("No fields to update");
		}

		const log = req.logger;
		const { email, aboutMe } = req.body;
		const userId = req.user.id;
		const file = req.file;

		let isNewEmail = false;

		log.info({ userId }, "Updating profile");

		if (email) {
			const userExists = await this._database
				.selectFrom("users")
				.select(["id"])
				.where("email", "=", email)
				.executeTakeFirst();

			if (userExists && userExists.id !== userId) {
				log.warn({ email }, "User with email already exists");
				throw new BadRequestError("User with email already exists");
			}

			if (userExists && userExists.id === userId) isNewEmail = false;
			else isNewEmail = true;
		}

		let fileUploadRes: FileUploadResponse | undefined;

		if (file) {
			fileUploadRes = await this._imageUploader.uploadFileFromBuffer(
				file.buffer,
				log,
			);
			if (req.user.avatar && req.user.avatarId)
				await this._imageUploader.deleteFile(req.user.avatarId);
		}

		if (email && isNewEmail) {
			const token = generateRandomToken();

			await this._database
				.updateTable("users")
				.set({
					aboutMe,
					avatar: fileUploadRes?.fileUrl,
					avatarId: fileUploadRes?.fileId,
					email,
					isVerified: false,
					updatedAt: new Date(),
					...(req.body.firstName && { firstName: req.body.firstName }),
					...(req.body.lastName && { lastName: req.body.lastName }),
				})
				.where("id", "=", userId)
				.execute();

			await Promise.all([
				this._authService.logout(req, res, req.logger),
				this._emailService.sendVerificationEmail(email, token, log),
				this._redis.set(
					token,
					email,
					"EX",
					Number(this._applicationConfig.sessionTtlInMinutes) * 60,
				),
			]);

			return;
		}

		await this._database
			.updateTable("users")
			.set({
				aboutMe,
				avatar: fileUploadRes?.fileUrl,
				avatarId: fileUploadRes?.fileId,
				updatedAt: new Date(),
				...(req.body.firstName && { firstName: req.body.firstName }),
				...(req.body.lastName && { lastName: req.body.lastName }),
			})
			.where("id", "=", userId)
			.execute();
	}

	async changeProfilePassword(
		user: User,
		payload: ChangeProfilePasswordRequestDto,
	) {
		if (
			!(await this._hashingService.verify(payload.oldPassword, user.password))
		)
			throw new BadRequestError("Invalid old password");

		const hashedPassword = await this._hashingService.hash(payload.newPassword);

		await this._database
			.updateTable("users")
			.set({
				password: hashedPassword,
			})
			.where("id", "=", user.id)
			.execute();
	}
}
