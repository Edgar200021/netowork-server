import vine from "@vinejs/vine";
import type { Request, Response } from "express";
import { SuccessResponseDto } from "../common/dto/base.dto.js";
import { UnauthorizedError } from "../common/error.js";
import { AVATAR_FILE_NAME } from "../const/multer.js";
import {
	type ChangeProfilePasswordRequestDto,
	changeProfilePasswordSchema,
} from "../dto/users/changeProfilePassword/changeProfilePasswordRequest.dto.js";
import type { ChangeProfilePasswordResponseDto } from "../dto/users/changeProfilePassword/changeProfilePasswordResponse.dto.js";
import type { GetProfileResponseDto } from "../dto/users/getProfile/getMeResponse.dto.js";
import {
	type UpdateProfileRequestDto,
	updateProfileSchema,
} from "../dto/users/updateProfile/updateProfileRequest.dto.js";
import type { UpdateProfileResponseDto } from "../dto/users/updateProfile/updateProfileResponse.dto.js";
import { UserResponseDto } from "../dto/users/userResponse.dto.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { UsersService } from "../services/users.service.js";
import type { NonEmptyArray } from "../types/common.js";
import type { AllowedMimeTypesValues } from "../types/mimeTypes.js";
import { asyncWrapper } from "../utils/handlerAsyncWrapper.js";
import { BaseHandler } from "./base.handler.js";

export class UsersHandler extends BaseHandler {
	protected validators = {
		updateProfile: vine.compile(updateProfileSchema),
		changeProfilePassword: vine.compile(changeProfilePasswordSchema),
	};

	constructor(
		private readonly _middlewares: Middlewares,
		private readonly _usersService: UsersService,
	) {
		super();
		this.bindMethods();
		this.setupRoutes();
	}

	/**
	 * @openapi
	 * paths:
	 *   api/v1/users/profile:
	 *     get:
	 *       tags:
	 *         - Users
	 *       summary: Get user profile
	 *       security:
	 *         - Session: []
	 *       responses:
	 *         200:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/GetMeResponseDto'
	 *         401:
	 *           description: Unauthorized (User is not logged in)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 */
	async getProfile(req: Request, res: Response<GetProfileResponseDto>) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		res.status(200).json(new SuccessResponseDto(new UserResponseDto(req.user)));
	}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/users/profile:
	 *     patch:
	 *       tags:
	 *         - Users
	 *       summary: Update user profile
	 *       security:
	 *         - Session: []
	 *       requestBody:
	 *         required: true
	 *         content:
	 *           multipart/form-data:
	 *             schema:
	 *               allOf:
	 *                 - $ref: "#/components/schemas/UpdateProfileRequestDto"
	 *                 - type: object
	 *                   properties:
	 *                     avatar:
	 *                       type: string
	 *                       format: binary
	 *                       description: User's avatar image file (JPG, PNG, max 5MB)
	 *       responses:
	 *         200:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/UpdateProfileResponseDto'
	 *         400:
	 *           description: Bad request or validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 oneOf:
	 *                   - $ref: '#/components/schemas/ErrorResponseDto'
	 *                   - $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 BadRequest:
	 *                   value:
	 *                     status: error
	 *                     error: "Unsupported media type. Use multipart/form-data"
	 *                 ValidationError:
	 *                   value:
	 *                     status: error
	 *                     errors:
	 *                       email: "Email is not valid"
	 *         401:
	 *           description: Unauthorized (User is not logged in)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 */
	async updateProfile(
		req: Request<unknown, UpdateProfileResponseDto, UpdateProfileRequestDto>,
		res: Response<UpdateProfileResponseDto>,
	) {
		await this._usersService.updateProfile(req, res);

		res
			.status(200)
			.json(new SuccessResponseDto("Profile updated successfully"));
	}

	/**
	 * @openapi
	 * paths:
	 *   api/v1/users/profile/change-password:
	 *     patch:
	 *       tags:
	 *         - Users
	 *       summary: Change user password
	 *       security:
	 *         - Session: []
	 *       requestBody:
	 *         required: true
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ChangeProfilePasswordRequestDto'
	 *       responses:
	 *         200:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ChangeProfilePasswordResponseDto'
	 *         400:
	 *           description: Bad request or validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 oneOf:
	 *                   - $ref: '#/components/schemas/ErrorResponseDto'
	 *                   - $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 BadRequest:
	 *                   value:
	 *                     status: error
	 *                     error: "Invalid old password"
	 *                 ValidationError:
	 *                   value:
	 *                     status: error
	 *                     errors:
	 *                       password: "Password must be at least 8 characters"
	 *         401:
	 *           description: Unauthorized (User is not logged in)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 */
	async changeProfilePassword(
		req: Request<
			unknown,
			ChangeProfilePasswordResponseDto,
			ChangeProfilePasswordRequestDto
		>,
		res: Response<ChangeProfilePasswordResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		await this._usersService.changeProfilePassword(req.user, req.body);

		res
			.status(200)
			.json(new SuccessResponseDto("Password updated successfully"));
	}

	protected bindMethods(): void {
		this.getProfile = this.getProfile.bind(this);
		this.updateProfile = this.updateProfile.bind(this);
		this.changeProfilePassword = this.changeProfilePassword.bind(this);
	}

	protected setupRoutes(): void {
		this._router.get(
			"/profile",
			this._middlewares.auth,
			asyncWrapper(this.getProfile),
		);
		this._router.patch(
			"/profile",
			this._middlewares.auth,
			this._middlewares.uploadFile(AVATAR_FILE_NAME, {
				single: true,
				mimeTypes: [
					"image/jpg",
					"image/jpeg",
					"image/png",
					"image/webp",
				] as NonEmptyArray<AllowedMimeTypesValues>,
			}),
			this._middlewares.validateRequest([{
				validatorOrSchema: this.validators.updateProfile,
				type: "body",
			}]),
			asyncWrapper(this.updateProfile),
		);
		this._router.patch(
			"/profile/change-password",
			this._middlewares.auth,
			this._middlewares.validateRequest([{
				validatorOrSchema: this.validators.changeProfilePassword,
				type: "body",
			}]),
			asyncWrapper(this.changeProfilePassword),
		);
	}
}
