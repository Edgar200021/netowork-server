import vine from "@vinejs/vine";
import type { Request, Response } from "express";
import {
	WORK_IMAGES_FILE_NAME,
	WORK_IMAGES_MAX_COUNT,
} from "../const/multer.js";
import {
	type CreateWorkRequestDto,
	createWorkSchema,
} from "../dto/works/createWork/createWorkRequest.dto.js";
import type { CreateWorkResponseDto } from "../dto/works/createWork/createWorkResponse.dto.js";
import {
	type DeleteWorkRequestDto,
	deleteWorkSchema,
} from "../dto/works/deleteWork/deleteWorkRequest.dto.js";
import type { DeleteWorkResponseDto } from "../dto/works/deleteWork/deleteWorkResponse.dto.js";
import type { GetWorksResponseDto } from "../dto/works/getWorks/getWorksResponse.dto.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import { SuccessResponseDto } from "../services/common/dto/base.dto.js";
import {
	BadRequestError,
	UnauthorizedError,
} from "../services/common/error.js";
import type { WorksService } from "../services/works.service.js";
import { asyncWrapper } from "../utils/handlerAsyncWrapper.js";
import { BaseHandler } from "./base.handler.js";

export class WorksHandler extends BaseHandler {
	protected validators = {
		createWork: vine.compile(createWorkSchema),
		deleteWork: vine.compile(deleteWorkSchema),
	};

	constructor(
		private readonly _middlewares: Middlewares,
		private readonly _workService: WorksService,
	) {
		super();
		this.bindMethods();
		this.setupRoutes();
	}

	/**
	 * @openapi
	 * paths:
	 *   api/v1/works:
	 *     post:
	 *       tags:
	 *         - Works
	 *       summary: Create work
	 *       security:
	 *         - Session: []
	 *       requestBody:
	 *         required: true
	 *         content:
	 *           multipart/form-data:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 title:
	 *                   type: string
	 *                   maxLength: 50
	 *                 images:
	 *                   type: array
	 *                   items:
	 *                     type: string
	 *                     format: binary
	 *       responses:
	 *         201:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/CreateWorkResponseDto'
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
	 *                       title: "Title is required"
	 *         401:
	 *           description: Unauthorized (User is not logged in)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 */
	async create(
		req: Request<unknown, CreateWorkResponseDto, CreateWorkRequestDto>,
		res: Response<CreateWorkResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");
		const files = Array.isArray(req.files)
			? req.files
			: req.files?.[WORK_IMAGES_FILE_NAME];

		if (!files || files.length <= 0)
			throw new BadRequestError("No files uploaded");

		const data = await this._workService.createWork(
			req.user.id,
			req.body,
			files,
			req.logger,
		);

		res.status(201).json(new SuccessResponseDto(data));
	}

	/**
	 * @openapi
	 * paths:
	 *   api/v1/works:
	 *     get:
	 *       tags:
	 *         - Works
	 *       summary: Get works
	 *       security:
	 *         - Session: []
	 *       responses:
	 *         200:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/GetWorksResponseDto'
	 *         401:
	 *           description: Unauthorized (User is not logged in)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 */
	async getWorks(
		req: Request<unknown, GetWorksResponseDto>,
		res: Response<GetWorksResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const works = await this._workService.getWorks(req.user.id, req.logger);

		res.status(200).send(new SuccessResponseDto(works));
	}

	/**
	 * @openapi
	 * paths:
	 *   api/v1/works/{id}:
	 *     delete:
	 *       tags:
	 *         - Works
	 *       summary: Delete work
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - name: id
	 *           in: path
	 *           required: true
	 *           description: Work ID
	 *           schema:
	 *             type: integer
	 *       responses:
	 *         200:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/DeleteWorkResponseDto'
	 *         400:
	 *           description: Validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *                 examples:
	 *                   ValidationError:
	 *                     value:
	 *                       status: error
	 *                       errors:
	 *                         id: "Work ID is required"
	 *         401:
	 *           description: Unauthorized (User is not logged in)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *         404:
	 *           description: Work not found
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 * 
	 */
	async deleteWork(
		req: Request<DeleteWorkRequestDto, DeleteWorkResponseDto>,
		res: Response<DeleteWorkResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		await this._workService.deleteWork(req.user.id, req.params, req.logger);

		res.status(200).send(new SuccessResponseDto("Work deleted successfully"));
	}

	protected bindMethods(): void {
		this.create = this.create.bind(this);
		this.getWorks = this.getWorks.bind(this);
		this.deleteWork = this.deleteWork.bind(this);
	}

	protected setupRoutes(): void {
		this.router.post(
			"/",
			this._middlewares.auth,
			this._middlewares.restrict(["freelancer"]),
			this._middlewares.uploadFile(WORK_IMAGES_FILE_NAME, {
				mimeTypes: [
					"image/avif",
					"image/bmp",
					"image/jpeg",
					"image/png",
					"image/jpg",
					"image/webp",
				],
				single: false,
				fileCount: WORK_IMAGES_MAX_COUNT,
			}),
			this._middlewares.validateRequest({
				bodyValidatorOrSchema: this.validators.createWork,
			}),
			asyncWrapper(this.create),
		);

		this.router.get(
			"/",
			this._middlewares.auth,
			this._middlewares.restrict(["freelancer"]),
			asyncWrapper(this.getWorks),
		);

		this.router.delete(
			"/:id",
			this._middlewares.auth,
			this._middlewares.restrict(["freelancer"]),
			this._middlewares.validateRequest({
				paramsValidatorOrSchema: this.validators.deleteWork,
			}),
			asyncWrapper(this.deleteWork),
		);
	}
}
