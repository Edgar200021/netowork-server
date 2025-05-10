import vine from "@vinejs/vine";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../common/error.js";
import { TASK_FILES_MAX_COUNT, TASK_FILES_NAME } from "../const/multer.js";
import type { CreateTaskRequestDto } from "../dto/task/createTask/createTaskRequest.dto.js";
import { createTaskSchema } from "../dto/task/createTask/createTaskRequest.dto.js";
import type { CreateTaskResponseDto } from "../dto/task/createTask/createTaskResponse.dto.js";
import {
	type GetAllTasksRequestDto,
	getAllTasksSchema,
} from "../dto/task/getAllTasks/getAllTasksRequest.dto.js";
import type { GetAllTasksResponseDto } from "../dto/task/getAllTasks/getAllTasksResponse.dto.js";
import { TaskResponseDto } from "../dto/task/taskResponse.dto.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { TaskService } from "../services/task.service.js";
import { asyncWrapper } from "../utils/handlerAsyncWrapper.js";
import { BaseHandler } from "./base.handler.js";
import { type GetMyTasksRequestDto, getMyTasksSchema } from '../dto/task/getMyTasks/getMyTasksRequest.dto.js';
import type { GetMyTasksResponseDto } from '../dto/task/getMyTasks/getMyTasksResponse.dto.js';

export class TaskHandler extends BaseHandler {
	protected validators = {
		createTask: vine.compile(createTaskSchema),
		getAllTasks: vine.compile(getAllTasksSchema),
		getMyTasks: vine.compile(getMyTasksSchema)
	};

	constructor(
		private readonly _middlewares: Middlewares,
		private readonly _taskService: TaskService,
	) {
		super();
		this.bindMethods();
		this.setupRoutes();
	}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks:
	 *     get:
	 *       tags:
	 *         - Tasks
	 *       summary: Get all tasks
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - in: query
	 *           name: limit
	 *           required: false
	 *           description: Number of tasks to return (max 200)
	 *           schema:
	 *             type: number
	 *             maximum: 200
	 *         - in: query
	 *           name: page
	 *           required: false
	 *           description: Page number
	 *           schema:
	 *             type: number
	 *       responses:
	 *         200:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/GetAllTasksResponseDto'
	 *         400:
	 *           description: Validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 LimitTooBig:
	 *                   summary: Limit exceeds maximum allowed value
	 *                   value:
	 *                     status: "error"
	 *                     errors:
	 *                       limit: "The limit must be less than or equal to 200."
	 *         401:
	 *           description: Unauthorized (User is not logged in)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *         403:
	 *           description: Forbidden (User does not have permission)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *               examples:
	 *                 NoPermission:
	 *                   summary: User lacks permission to access this resource
	 *                   value:
	 *                     message: "You do not have permission to access this resource."
	 */
	async getAllTasks(
		req: Request<
			unknown,
			GetAllTasksResponseDto,
			unknown,
			GetAllTasksRequestDto
		>,
		res: Response<GetAllTasksResponseDto>,
	) {
		if (!req.user) {
			throw new UnauthorizedError("Unauthorized");
		}

		const tasks = await this._taskService.getAllTasks(req.query, req.logger);

		res.status(200).json({
			status: "success",
			data: tasks.map((task) => new TaskResponseDto(task)),
		});
	}

		/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks/my-tasks:
	 *     get:
	 *       tags:
	 *         - Tasks
	 *       summary: Get my tasks
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - in: query
	 *           name: limit
	 *           required: false
	 *           description: Number of tasks to return (max 200)
	 *           schema:
	 *             type: number
	 *             maximum: 200
	 *         - in: query
	 *           name: page
	 *           required: false
	 *           description: Page number
	 *           schema:
	 *             type: number
	 *         - in: query
	 *           name: status
	 *           required: false
	 *           description: Task status
	 *           schema:
	 *             type: string
	 *             enum: [completed, in_progress, open]
	 *       responses:
	 *         200:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/GetMyTasksResponseDto'
	 *         400:
	 *           description: Validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 LimitTooBig:
	 *                   summary: Limit exceeds maximum allowed value
	 *                   value:
	 *                     status: "error"
	 *                     errors:
	 *                       limit: "The limit must be less than or equal to 200."
	 *         401:
	 *           description: Unauthorized (User is not logged in)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *         403:
	 *           description: Forbidden (User does not have permission)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *               examples:
	 *                 NoPermission:
	 *                   summary: User lacks permission to access this resource
	 *                   value:
	 *                     message: "You do not have permission to access this resource."
	 */
		async getMyTasks(
			req: Request<
				unknown,
				GetMyTasksResponseDto,
				unknown,
				GetMyTasksRequestDto
			>,
			res: Response<GetMyTasksResponseDto>,
		) {
			if (!req.user) {
				throw new UnauthorizedError("Unauthorized");
			}
	
			const tasks = await this._taskService.getMyTasks(req.user.id, req.query, req.logger);
	
			res.status(200).json({
				status: "success",
				data: tasks.map((task) => new TaskResponseDto(task)),
			});
		}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks:
	 *     post:
	 *       tags:
	 *         - Tasks
	 *       summary: Create task
	 *       security:
	 *         - Session: []
	 *       requestBody:
	 *         required: true
	 *         content:
	 *           multipart/form-data:
	 *             schema:
	 *               allOf:
	 *                 - $ref: "#/components/schemas/CreateTaskRequestDto"
	 *                 - type: object
	 *                   properties:
	 *                     files:
	 *                       type: array
	 *                       items:
	 *                         type: string
	 *                         format: binary
	 *       responses:
	 *         201:
	 *           description: Task created
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/CreateTaskResponseDto'
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
	 *                       - field: title
	 *                         message: "Title is required"
	 *                       - field: description
	 *                         message: "Description is required"
	 *                       - field: categoryId
	 *                         message: "Category ID is required"
	 *         401:
	 *           description: Unauthorized
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *         403:
	 *           description: Forbidden
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *
	 */
	async createTask(
		req: Request<unknown, CreateTaskResponseDto, CreateTaskRequestDto>,
		res: Response<CreateTaskResponseDto>,
	) {
		if (!req.user) {
			throw new UnauthorizedError("Unauthorized");
		}

		const files = Array.isArray(req.files)
			? req.files
			: req.files?.[TASK_FILES_NAME];

		const task = await this._taskService.create(
			req.user.id,
			req.body,
			req.logger,
			files,
		);

		res.status(201).json({
			status: "success",
			data: new TaskResponseDto({
				...task,
				creator: `${req.user.firstName} ${req.user.lastName}`,
			}),
		});
	}

	protected bindMethods(): void {
		this.getAllTasks = this.getAllTasks.bind(this);
		this.getMyTasks = this.getMyTasks.bind(this);
		this.createTask = this.createTask.bind(this);
	}

	protected setupRoutes(): void {
		this.router.get(
			"/",
			this._middlewares.auth,
			this._middlewares.restrict(["freelancer", "admin"]),
			this._middlewares.validateRequest({
				validatorOrSchema: this.validators.getAllTasks,
				type: "query",
			}),
			asyncWrapper(this.getAllTasks),
		);
		this.router.get(
			"/my-tasks",
			this._middlewares.auth,
			this._middlewares.restrict(["client"]),
			this._middlewares.validateRequest({
				validatorOrSchema: this.validators.getMyTasks,
				type: "query",
			}),
			asyncWrapper(this.getMyTasks),
		);
		this.router.post(
			"/",
			this._middlewares.auth,
			this._middlewares.restrict(["client"]),
			this._middlewares.uploadFile(TASK_FILES_NAME, {
				fileCount: TASK_FILES_MAX_COUNT,
				single: false,
				mimeTypes: [
					"application/msword",
					"application/pdf",
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				],
			}),
			this._middlewares.validateRequest({
				validatorOrSchema: this.validators.createTask,
				type: "body",
			}),
			asyncWrapper(this.createTask),
		);
	}
}
