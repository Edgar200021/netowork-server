import vine from "@vinejs/vine";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../common/error.js";
import { AVATAR_FILE_NAME } from "../const/multer.js";
import type { GetProfileResponseDto } from "../dto/users/getProfile/getMeResponse.dto.js";
import {
	type UpdateProfileRequestDto,
	updateProfileSchema,
} from "../dto/users/updateProfile/updateProfileRequest.dto.js";
import type { UpdateProfileResponseDto } from "../dto/users/updateProfile/updateProfileResponse.dto.js";
import { UserResponseDto } from "../dto/users/userResponse.dto.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { UsersService } from "../services/users.service.js";
import { asyncWrapper } from "../utils/handlerAsyncWrapper.js";
import { BaseHandler } from "./base.handler.js";

export class UsersHandler extends BaseHandler {
	protected validators = {
		updateProfile: vine.compile(updateProfileSchema),
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
	 *   /users/profile:
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

		res.status(200).json({
			status: "success",
			data: new UserResponseDto(req.user),
		});
	}

	/**
	 * @openapi
	 * paths:
	 *   /users/profile:
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
	 *               type: object
	 *               properties:
	 *                 email:
	 *                   type: string
	 *                   format: email
	 *                 aboutMe:
	 *                   type: string
	 *                   maxLength: 1000
	 *                 avatar:
	 *                   type: string
	 *                   format: binary
	 *                   description: User's avatar image file (JPG, PNG, max 5MB)
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

		res.status(200).json({
			status: "success",
			data: "Profile updated successfully",
		});
	}

	protected bindMethods(): void {
		this.getProfile = this.getProfile.bind(this);
		this.updateProfile = this.updateProfile.bind(this);
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
			this._middlewares.uploadFile(AVATAR_FILE_NAME, [
				"image/jpg",
				"image/jpeg",
				"image/png",
				"image/webp",
			]),
			this._middlewares.validateRequest(this.validators.updateProfile),
			asyncWrapper(this.updateProfile),
		);
	}
}
