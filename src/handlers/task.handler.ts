import vine from "@vinejs/vine";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../common/error.js";
import { TASK_FILES_MAX_COUNT, TASK_FILES_NAME } from "../const/multer.js";
import type { CreateTaskRequestDto } from "../dto/task/createTask/createTaskRequest.dto.js";
import { createTaskRequestSchema } from "../dto/task/createTask/createTaskRequest.dto.js";
import type { CreateTaskResponseDto } from "../dto/task/createTask/createTaskResponse.dto.js";
import type {} from "../dto/task/createTaskReply/createTaskReplyRequest.dto.js";
import {
	type CreateTaskReplyRequestDto,
	type CreateTaskReplyRequestParamsDto,
	createTaskReplyRequestParamsSchema,
	createTaskReplyRequestSchema,
} from "../dto/task/createTaskReply/createTaskReplyRequest.dto.js";
import type { CreateTaskReplyResponseDto } from "../dto/task/createTaskReply/createTaskReplyResponse.dto.js";
import { deleteTaskRequestParamsSchema } from "../dto/task/deleteTask/deleteTaskRequest.dto.js";
import type { DeleteTaskResponseDto } from "../dto/task/deleteTask/deleteTaskResponse.dto.js";
import {
	type DeleteTaskFilesRequestParamsDto,
	deleteTaskFilesRequestParamsSchema,
} from "../dto/task/deleteTaskFiles/deleteTaskFilesRequest.dto.js";
import type { DeleteTaskFilesResponseDto } from "../dto/task/deleteTaskFiles/deleteTaskFilesResponse.dto.js";
import {
	type GetAllTasksRequestQueryDto,
	getAllTasksRequestQuerySchema,
} from "../dto/task/getAllTasks/getAllTasksRequest.dto.js";
import type { GetAllTasksResponseDto } from "../dto/task/getAllTasks/getAllTasksResponse.dto.js";
import {
	type GetMyTaskRepliesRequestParamsDto,
	type GetMyTaskRepliesRequestQueryDto,
	getMyTaskRepliesRequestParamsSchema,
	getMyTaskRepliesRequestQuerySchema,
} from "../dto/task/getMyTaskReplies/getMyTaskRepliesRequest.dto.js";
import type { GetMyTaskRepliesResponseDto } from "../dto/task/getMyTaskReplies/getMyTaskRepliesResponse.dto.js";
import {
	type GetMyTasksRequestQueryDto,
	getMyTasksRequestQuerySchema,
} from "../dto/task/getMyTasks/getMyTasksRequest.dto.js";
import type { GetMyTasksResponseDto } from "../dto/task/getMyTasks/getMyTasksResponse.dto.js";
import {
	type GetTaskRequestParamsDto,
	getTaskRequestParamsSchema,
} from "../dto/task/getTask/getTaskRequest.dto.js";
import type { GetTaskResponseDto } from "../dto/task/getTask/getTaskResponse.dto.js";
import {
	type GetTasksByMyRepliesRequestQueryDto,
	getTasksByMyRepliesRequestQuerySchema,
} from "../dto/task/getTasksByMyReplies/getTasksByMyRepliesRequest.dto.js";
import type { GetTasksByMyRepliesResponseDto } from "../dto/task/getTasksByMyReplies/getTasksByMyRepliesResponse.dto.js";
import type { IncrementTaskViewResponseDto } from "../dto/task/incrementView/incrementTaskViewResponse.dto.js";
import {
	type IncrementTaskViewRequestParamsDto,
	incrementTaskViewRequestParamsSchema,
} from "../dto/task/incrementView/incrementViewRequest.dto.js";
import { MyTaskRepliesResponseDto } from "../dto/task/myTaskRepliesResponse.dto.js";
import { TaskResponseDto } from "../dto/task/taskResponse.dto.js";
import {
	type UpdateTaskRequestDto,
	type UpdateTaskRequestParamsDto,
	updateTaskRequestParamsSchema,
	updateTaskRequestSchema,
} from "../dto/task/updateTask/updateTaskRequest.js";
import type { UpdateTaskResponseDto } from "../dto/task/updateTask/updateTaskResponse.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { TaskService } from "../services/task.service.js";
import { UserRole } from "../storage/db.js";
import { asyncWrapper } from "../utils/handlerAsyncWrapper.js";
import { BaseHandler } from "./base.handler.js";

export class TaskHandler extends BaseHandler {
	protected validators = {
		createTask: vine.compile(createTaskRequestSchema),
		getAllTasksQuery: vine.compile(getAllTasksRequestQuerySchema),
		getMyTasksQuery: vine.compile(getMyTasksRequestQuerySchema),
		getTask: vine.compile(getTaskRequestParamsSchema),
		updateTask: vine.compile(updateTaskRequestSchema),
		updateTaskParams: vine.compile(updateTaskRequestParamsSchema),
		deleteTaskParams: vine.compile(deleteTaskRequestParamsSchema),
		deleteTaskFilesParams: vine.compile(deleteTaskFilesRequestParamsSchema),
		incrementTaskView: vine.compile(incrementTaskViewRequestParamsSchema),
		createTaskReply: vine.compile(createTaskReplyRequestSchema),
		createTaskReplyParams: vine.compile(createTaskReplyRequestParamsSchema),
		getMyTaskRepliesParams: vine.compile(getMyTaskRepliesRequestParamsSchema),
		getMyTaskRepliesQuery: vine.compile(getMyTaskRepliesRequestQuerySchema),
		getTasksByMyReplies: vine.compile(getTasksByMyRepliesRequestQuerySchema),
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
	 *         - in: query
	 *           name: search
	 *           required: false
	 *           description: Search query
	 *           schema:
	 *             type: string
	 *         - in: query
	 *           name: subCategoryIds
	 *           required: false
	 *           description: Comma-separated list of subcategory IDs
	 *           example: 1,2,3
	 *           schema:
	 *             type: string
	 *         - in: query
	 *           name: sort
	 *           required: false
	 *           description: Comma-separated list of sort parameters
	 *           example: price-desc, createdAt-asc
	 *           schema:
	 *             type: string
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
	 *                     status: "error"
	 *                     message: "You do not have permission to access this resource."
	 */
	async getAllTasks(
		req: Request<
			unknown,
			GetAllTasksResponseDto,
			unknown,
			GetAllTasksRequestQueryDto
		>,
		res: Response<GetAllTasksResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const { tasks, totalCount } = await this._taskService.getAllTasks(
			req.query,
			req.logger,
		);

		res.status(200).json({
			status: "success",
			data: {
				tasks: tasks.map((task) => new TaskResponseDto(task)),
				totalCount,
			},
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
	 *                     status: "error"
	 *                     error: "You don't have permission to access this resource."
	 */
	async getMyTasks(
		req: Request<
			unknown,
			GetMyTasksResponseDto,
			unknown,
			GetMyTasksRequestQueryDto
		>,
		res: Response<GetMyTasksResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const { tasks, totalCount } = await this._taskService.getMyTasks(
			req.user.id,
			req.query,
			req.logger,
		);

		res.status(200).json({
			status: "success",
			data: {
				tasks: tasks.map((task) => new TaskResponseDto(task)),
				totalCount,
			},
		});
	}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks/{taskId}:
	 *     get:
	 *       tags:
	 *         - Tasks
	 *       summary: Get task
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - name: taskId
	 *           in: path
	 *           required: true
	 *           description: Task ID
	 *           schema:
	 *             type: string
	 *             format: uuid
	 *       responses:
	 *         200:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/GetTaskResponseDto'
	 *         400:
	 *           description: Validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 invalidTaskId:
	 *                   summary: Invalid task ID
	 *                   value:
	 *                     status: "error"
	 *                     errors:
	 *                       taskId: "The taskId field must be a number."
	 *         401:
	 *           description: Unauthorized
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
	 */
	async getTask(
		req: Request<GetTaskRequestParamsDto, GetTaskResponseDto>,
		res: Response<GetTaskResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const task = await this._taskService.getTask(
			req.user.id,
			req.params,
			req.logger,
		);

		res.status(200).json({
			status: "success",
			data: new TaskResponseDto(task),
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
		if (!req.user) throw new UnauthorizedError("Unauthorized");

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

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks/{taskId}:
	 *     patch:
	 *       tags:
	 *         - Tasks
	 *       summary: Update task
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - name: taskId
	 *           in: path
	 *           required: true
	 *           description: Task ID
	 *           schema:
	 *             type: string
	 *             format: uuid
	 *       requestBody:
	 *         content:
	 *           multipart/form-data:
	 *             schema:
	 *               allOf:
	 *                 - $ref: "#/components/schemas/UpdateTaskRequestDto"
	 *                 - type: object
	 *                   properties:
	 *                     files:
	 *                       type: array
	 *                       items:
	 *                         type: string
	 *                         format: binary
	 *       responses:
	 *         200:
	 *           description: Task updated
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/UpdateTaskResponseDto'
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
	 *                         message: "Title is less then 5 characters"
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
	async updateTask(
		req: Request<
			UpdateTaskRequestParamsDto,
			UpdateTaskResponseDto,
			UpdateTaskRequestDto
		>,
		res: Response<UpdateTaskResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const files = Array.isArray(req.files)
			? req.files
			: req.files?.[TASK_FILES_NAME];

		const task = await this._taskService.update(
			req.user.id,
			req.body,
			req.params,
			req.logger,
			files,
		);

		res.status(200).json({
			status: "success",
			data: new TaskResponseDto({
				...task,
				creator: `${req.user.firstName} ${req.user.lastName}`,
			}),
		});
	}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks/{taskId}:
	 *     delete:
	 *       tags:
	 *         - Tasks
	 *       summary: Delete task
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - name: taskId
	 *           in: path
	 *           required: true
	 *           description: Task ID
	 *           schema:
	 *             type: string
	 *             format: uuid
	 *       responses:
	 *         200:
	 *           description: Task deleted
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: "#/components/schemas/DeleteTaskResponseDto"
	 *         400:
	 *           description: Bad request or validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 oneOf:
	 *                   - $ref: '#/components/schemas/ErrorResponseDto'
	 *                   - $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 ValidationError:
	 *                   value:
	 *                     status: error
	 *                     errors:
	 *                       - field: taskId
	 *                         message: "Task ID is required"
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
	 */
	async deleteTask(
		req: Request<DeleteTaskFilesRequestParamsDto, DeleteTaskResponseDto>,
		res: Response<DeleteTaskResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		await this._taskService.deleteTask(req.user.id, req.params, req.logger);

		res.status(200).json({
			status: "success",
			data: "Task deleted successfully",
		});
	}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks/{taskId}/files/{fileId}:
	 *     delete:
	 *       tags:
	 *         - Tasks
	 *       summary: Delete task files
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - name: taskId
	 *           in: path
	 *           required: true
	 *           description: Task ID
	 *           schema:
	 *             type: string
	 *             format: uuid
	 *         - name: fileId
	 *           in: path
	 *           required: true
	 *           description: File ID
	 *           schema:
	 *             type: string
	 *       responses:
	 *         200:
	 *           description: Task files deleted
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: "#/components/schemas/DeleteTaskFilesResponseDto"
	 *         400:
	 *           description: Bad request or validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 oneOf:
	 *                   - $ref: '#/components/schemas/ErrorResponseDto'
	 *                   - $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 ValidationError:
	 *                   value:
	 *                     status: error
	 *                     errors:
	 *                       - field: taskIds
	 *                         message: "Task IDs are required"
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
	 */
	async deleteTaskFiles(
		req: Request<DeleteTaskFilesRequestParamsDto, DeleteTaskFilesResponseDto>,
		res: Response<DeleteTaskFilesResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const task = await this._taskService.deleteTaskFile(
			req.user.id,
			req.params,
			req.logger,
		);

		res.status(200).json({
			status: "success",
			data: new TaskResponseDto({
				...task,
				creator: `${req.user.firstName} ${req.user.lastName}`,
			}),
		});
	}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks/{taskId}/increment-view:
	 *     post:
	 *       tags:
	 *         - Tasks
	 *       summary: Increment task view
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - name: taskId
	 *           in: path
	 *           required: true
	 *           description: Task ID
	 *           schema:
	 *             type: string
	 *             format: uuid
	 *       responses:
	 *         200:
	 *           description: Task view incremented
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: "#/components/schemas/IncrementTaskViewResponseDto"
	 *         400:
	 *           description: Bad request or validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 oneOf:
	 *                   - $ref: '#/components/schemas/ErrorResponseDto'
	 *                   - $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 ValidationError:
	 *                   value:
	 *                     status: error
	 *                     errors:
	 *                       - field: taskId
	 *                         message: "Task ID is required"
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
	 */
	async incrementTaskView(
		req: Request<IncrementTaskViewRequestParamsDto>,
		res: Response<IncrementTaskViewResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");
		await this._taskService.incrementTaskView(req.user.id, req.params.taskId);

		res.status(200).json({
			status: "success",
			data: null,
		});
	}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks/{taskId}/replies:
	 *     post:
	 *       tags:
	 *         - Tasks
	 *       summary: Create task reply
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - name: taskId
	 *           in: path
	 *           required: true
	 *           description: Task ID
	 *           schema:
	 *             type: string
	 *             format: uuid
	 *       requestBody:
	 *         required: true
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/CreateTaskReplyRequestDto'
	 *       responses:
	 *         201:
	 *           description: Task reply created
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: "#/components/schemas/CreateTaskReplyResponseDto"
	 *         400:
	 *           description: Bad request or validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 oneOf:
	 *                   - $ref: '#/components/schemas/ErrorResponseDto'
	 *                   - $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 ValidationError:
	 *                   value:
	 *                     status: error
	 *                     errors:
	 *                       - field: description
	 *                         message: "Description is required"
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
	 */
	async createTaskReply(
		req: Request<
			CreateTaskReplyRequestParamsDto,
			CreateTaskReplyResponseDto,
			CreateTaskReplyRequestDto
		>,
		res: Response<CreateTaskReplyResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		await this._taskService.createTaskReply(
			req.user.id,
			req.body,
			req.params,
			req.logger,
		);

		res.status(201).json({
			status: "success",
			data: null,
		});
	}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks/{taskId}/replies:
	 *     get:
	 *       tags:
	 *         - Tasks
	 *       summary: Get task replies
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - name: taskId
	 *           in: path
	 *           required: true
	 *           description: Task ID
	 *           schema:
	 *             type: string
	 *             format: uuid
	 *         - name: page
	 *           in: query
	 *           required: false
	 *           description: Page number
	 *           schema:
	 *             type: number
	 *             minimum: 1
	 *         - name: limit
	 *           in: query
	 *           required: false
	 *           description: Limit
	 *           schema:
	 *             type: number
	 *             minimum: 1
	 *             maximum: 50
	 *       responses:
	 *         200:
	 *           description: Task replies
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/GetTaskRepliesResponseDto'
	 *         400:
	 *           description: Bad request or validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 oneOf:
	 *                   - $ref: '#/components/schemas/ErrorResponseDto'
	 *                   - $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 ValidationError:
	 *                   value:
	 *                     status: error
	 *                     errors:
	 *                       - field: taskId
	 *                         message: "Task must be provided"
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
	 *         404:
	 *           description: Task not found
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *
	 */
	async getMyTaskReplies(
		req: Request<
			GetMyTaskRepliesRequestParamsDto,
			GetMyTaskRepliesResponseDto,
			unknown,
			GetMyTaskRepliesRequestQueryDto
		>,
		res: Response<GetMyTaskRepliesResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const { replies, totalCount } = await this._taskService.getMyTaskReplies(
			req.user.id,
			req.params,
			req.query,
			req.logger,
		);

		res.status(200).json({
			status: "success",
			data: {
				replies: replies.map((t) => new MyTaskRepliesResponseDto(t)),
				totalCount,
			},
		});
	}

	/**
	 * @openapi
	 * paths:
	 *   /api/v1/tasks/by-my-replies:
	 *     get:
	 *       tags:
	 *         - Tasks
	 *       summary: Get tasks by my replies
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
	 *                 $ref: '#/components/schemas/GetTasksByMyRepliesResponseDto'
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
	 *                     status: "error"
	 *                     message: "You do not have permission to access this resource."
	 */
	async getTasksByMyReplies(
		req: Request<
			unknown,
			GetTasksByMyRepliesResponseDto,
			unknown,
			GetTasksByMyRepliesRequestQueryDto
		>,
		res: Response<GetTasksByMyRepliesResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const { tasks, totalCount } = await this._taskService.getTasksByMyReplies(
			req.user.id,
			req.query,
			req.logger,
		);

		res.status(200).json({
			status: "success",
			data: {
				tasks: tasks.map((t) => new TaskResponseDto(t)),
				totalCount,
			},
		});
	}

	protected bindMethods(): void {
		this.getAllTasks = this.getAllTasks.bind(this);
		this.getMyTasks = this.getMyTasks.bind(this);
		this.getTask = this.getTask.bind(this);
		this.createTask = this.createTask.bind(this);
		this.updateTask = this.updateTask.bind(this);
		this.deleteTask = this.deleteTask.bind(this);
		this.deleteTaskFiles = this.deleteTaskFiles.bind(this);
		this.incrementTaskView = this.incrementTaskView.bind(this);
		this.createTaskReply = this.createTaskReply.bind(this);
		this.getMyTaskReplies = this.getMyTaskReplies.bind(this);
		this.getTasksByMyReplies = this.getTasksByMyReplies.bind(this);
	}

	protected setupRoutes(): void {
		this.router.get(
			"/",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Freelancer, UserRole.Admin]),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.getAllTasksQuery,
					type: "query",
				},
			]),
			asyncWrapper(this.getAllTasks),
		);
		this.router.post(
			"/",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Client]),
			this._middlewares.uploadFile(TASK_FILES_NAME, {
				fileCount: TASK_FILES_MAX_COUNT,
				single: false,
				mimeTypes: [
					"application/msword",
					"application/pdf",
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
					"text/plain",
				],
			}),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.createTask,
					type: "body",
				},
			]),
			asyncWrapper(this.createTask),
		);
		this.router.get(
			"/my-tasks",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Client]),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.getMyTasksQuery,
					type: "query",
				},
			]),
			asyncWrapper(this.getMyTasks),
		);

		this.router.get(
			"/by-my-replies",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Freelancer]),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.getTasksByMyReplies,
					type: "query",
				},
			]),
			asyncWrapper(this.getTasksByMyReplies),
		);

		this.router.get(
			"/:taskId",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Freelancer, UserRole.Admin]),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.getTask,
					type: "params",
				},
			]),
			//@ts-ignore
			asyncWrapper(this.getTask),
		);

		this.router.patch(
			"/:taskId",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Client]),
			this._middlewares.uploadFile(TASK_FILES_NAME, {
				fileCount: TASK_FILES_MAX_COUNT,
				single: false,
				mimeTypes: [
					"application/msword",
					"application/pdf",
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
					"text/plain",
				],
			}),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.updateTask,
					type: "body",
				},
				{
					validatorOrSchema: this.validators.updateTaskParams,
					type: "params",
				},
			]),
			//@ts-ignore
			asyncWrapper(this.updateTask),
		);
		this.router.delete(
			"/:taskId",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Client]),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.deleteTaskParams,
					type: "params",
				},
			]),
			//@ts-ignore
			asyncWrapper(this.deleteTask),
		);
		this.router.post(
			"/:taskId/increment-view",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Freelancer]),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.incrementTaskView,
					type: "params",
				},
			]),
			//@ts-ignore
			asyncWrapper(this.incrementTaskView),
		);
		this.router.delete(
			"/:taskId/files/:fileId",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Client]),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.deleteTaskFilesParams,
					type: "params",
				},
			]),
			//@ts-ignore
			asyncWrapper(this.deleteTaskFiles),
		);

		this.router.post(
			"/:taskId/replies",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Freelancer]),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.createTaskReplyParams,
					type: "params",
				},
				{
					validatorOrSchema: this.validators.createTaskReply,
					type: "body",
				},
			]),
			//@ts-ignore
			asyncWrapper(this.createTaskReply),
		);

		this.router.get(
			"/:taskId/replies",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Client]),
			this._middlewares.validateRequest([
				{
					validatorOrSchema: this.validators.getMyTaskRepliesParams,
					type: "params",
				},
				{
					validatorOrSchema: this.validators.getMyTaskRepliesQuery,
					type: "query",
				},
			]),
			//@ts-ignore
			asyncWrapper(this.getMyTaskReplies),
		);
	}
}
