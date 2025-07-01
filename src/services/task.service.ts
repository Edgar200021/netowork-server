import path from "node:path";
import { sql } from "kysely";
import { BadRequestError, NotFoundError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import { TASK_FILES_MAX_COUNT } from "../const/multer.js";
import {
	GET_TASKS_DEFAULT_LIMIT,
	GET_TASKS_DEFAULT_PAGE,
} from "../const/task.js";
import { GET_TASK_REPLIES_MAX_LIMIT } from "../const/validator.js";
import type { CreateTaskRequestDto } from "../dto/task/createTask/createTaskRequest.dto.js";
import type {
	CreateTaskReplyRequestDto,
	CreateTaskReplyRequestParamsDto,
} from "../dto/task/createTaskReply/createTaskReplyRequest.dto.js";
import type { DeleteTaskRequestParamsDto } from "../dto/task/deleteTask/deleteTaskRequest.dto.js";
import type { DeleteTaskFilesRequestParamsDto } from "../dto/task/deleteTaskFiles/deleteTaskFilesRequest.dto.js";
import type { GetAllTasksRequestQueryDto } from "../dto/task/getAllTasks/getAllTasksRequest.dto.js";
import type {
	GetMyTaskRepliesRequestParamsDto,
	GetMyTaskRepliesRequestQueryDto,
} from "../dto/task/getMyTaskReplies/getMyTaskRepliesRequest.dto.js";
import type { GetMyTasksRequestQueryDto } from "../dto/task/getMyTasks/getMyTasksRequest.dto.js";
import type { GetTaskRequestParamsDto } from "../dto/task/getTask/getTaskRequest.dto.js";
import type { GetTasksByMyRepliesRequestQueryDto } from "../dto/task/getTasksByMyReplies/getTasksByMyRepliesRequest.dto.js";
import type {
	UpdateTaskRequestDto,
	UpdateTaskRequestParamsDto,
} from "../dto/task/updateTask/updateTaskRequest.js";
import { type TaskFiles, TaskStatus } from "../storage/db.js";
import type { Database } from "../storage/postgres/database.js";
import type { Task } from "../storage/postgres/types/task.type.js";
import type { User } from "../storage/postgres/types/user.types.js";
import type { FileUploadResponse } from "../types/cloudinary.js";
import { isDatabaseError } from "../types/database.js";
import { AllowedMimeTypes } from "../types/mimeTypes.js";
import type { MyTaskRepliesReturn, TaskReturn } from "../types/tasks.js";
import { uploadFiles } from "../utils/uploadFiles.js";
import type { EmailService } from "./email.service.js";
import type { FileUploader } from "./fileUploader.service.js";

export class TaskService {
	constructor(
		private readonly _database: Database,
		private readonly _fileUploader: FileUploader,
		private readonly _emailService: EmailService,
	) {}

	async getAllTasks(
		getAllTasksRequestQueryDto: GetAllTasksRequestQueryDto,
		log: LoggerService,
	): Promise<{
		tasks: TaskReturn[];
		totalCount: number;
	}> {
		log.info("Getting all tasks");

		const limit =
			Number(getAllTasksRequestQueryDto.limit) || GET_TASKS_DEFAULT_LIMIT;
		const page =
			Number(getAllTasksRequestQueryDto.page) || GET_TASKS_DEFAULT_PAGE;

		const tasks = await this.getTaskBaseQuery()
			.select(sql<number>`COUNT(*) OVER()::INTEGER`.as("totalCount"))
			.where("status", "=", TaskStatus.Open)
			.$if(!!getAllTasksRequestQueryDto.subCategoryIds, (qb) =>
				qb.where(
					"subcategory.id",
					"in",
					getAllTasksRequestQueryDto.subCategoryIds!.split(",").map(Number),
				),
			)
			.$if(!!getAllTasksRequestQueryDto.search, (qb) =>
				qb.where(
					sql`LOWER(task.title)`,
					"like",
					`%${getAllTasksRequestQueryDto.search?.toLowerCase()}%`,
				),
			)
			.$if(!getAllTasksRequestQueryDto.sort, (qb) =>
				qb.orderBy("task.createdAt", "desc"),
			)
			.$if(!!getAllTasksRequestQueryDto.sort, (qb) =>
				qb.orderBy(
					getAllTasksRequestQueryDto.sort!.split(",").map((val) => {
						const [field, order] = val.split("-");
						return `task.${field} ${order}`;
					}),
				),
			)
			.limit(limit)
			.offset((page - 1) * limit)
			.execute();

		return {
			tasks: tasks.map((t) => ({
				...t,
				category: t.categoryName,
				subcategory: t.subcategoryName,
				creator: `${t.firstName} ${t.lastName}`,
			})),
			totalCount: tasks[0]?.totalCount || 0,
		};
	}

	async getTask(
		userId: User["id"],
		{ taskId }: GetTaskRequestParamsDto,
		log: LoggerService,
	): Promise<TaskReturn> {
		log.info({ taskId }, "Getting task");

		const task = await this.getTaskBaseQuery()
			.where("task.id", "=", taskId)
			.executeTakeFirst();

		if (!task) {
			log.warn({ taskId }, "Task not found");
			throw new NotFoundError("Task not found");
		}

		this.incrementTaskView(userId, taskId);

		return {
			...task,
			category: task.categoryName,
			subcategory: task.subcategoryName,
			creator: `${task.firstName} ${task.lastName}`,
		};
	}

	async getMyTasks(
		userId: User["id"],
		getMyTasksRequestDto: GetMyTasksRequestQueryDto,
		log: LoggerService,
	): Promise<{
		tasks: TaskReturn[];
		totalCount: number;
	}> {
		log.info({ userId }, "Getting my tasks");

		const limit = Number(getMyTasksRequestDto.limit) || GET_TASKS_DEFAULT_LIMIT;
		const page = Number(getMyTasksRequestDto.page) || GET_TASKS_DEFAULT_PAGE;

		let tasksQuery = this.getTaskBaseQuery()
			.select(sql<number>`COUNT(*) OVER()::INTEGER`.as("totalCount"))
			.select(["notifyAboutReplies"])
			.where("clientId", "=", userId)
			.orderBy("task.createdAt", "desc")
			.limit(limit)
			.offset((page - 1) * limit);

		if (getMyTasksRequestDto.status) {
			tasksQuery = tasksQuery.where(
				"task.status",
				"=",
				getMyTasksRequestDto.status,
			);
		}

		const tasks = await tasksQuery.execute();

		return {
			tasks: tasks.map((t) => ({
				...t,
				category: t.categoryName,
				subcategory: t.subcategoryName,
				creator: `${t.firstName} ${t.lastName}`,
			})),
			totalCount: tasks[0]?.totalCount || 0,
		};
	}

	async create(
		userId: User["id"],
		createTaskRequestDto: CreateTaskRequestDto,
		log: LoggerService,
		files?: Express.Multer.File[],
	): Promise<Omit<TaskReturn, "creator" | "views">> {
		log.info({ userId }, "Creating task");

		const category = await this._database
			.selectFrom("category")
			.innerJoin(
				"category as subcategory",
				"category.id",
				"subcategory.parentId",
			)
			.select([
				"category.id as categoryId",
				"subcategory.id as subCategoryId",
				"category.name as category",
				"subcategory.name as subcategory",
			])
			.where("category.id", "=", Number(createTaskRequestDto.categoryId))
			.where("subcategory.id", "=", Number(createTaskRequestDto.subCategoryId))
			.where(
				"subcategory.parentId",
				"=",
				Number(createTaskRequestDto.categoryId),
			)
			.executeTakeFirst();

		if (!category) {
			log.warn(
				{
					categoryId: createTaskRequestDto.categoryId,
					subCategoryId: createTaskRequestDto.subCategoryId,
				},
				"Category or subcategory not found",
			);
			throw new BadRequestError("Category or subcategory not found");
		}

		const uploadedFiles: FileUploadResponse[] = await uploadFiles(
			this._fileUploader,
			files,
			log,
		);

		const result = await this._database.transaction().execute(async (trx) => {
			const task = await trx
				.insertInto("task")
				.values({
					title: createTaskRequestDto.title,
					description: createTaskRequestDto.description,
					clientId: userId,
					categoryId: category.categoryId,
					subcategoryId: category.subCategoryId,
					price: Number(createTaskRequestDto.price),
					createdAt: sql`now()`,
					updatedAt: sql`now()`,
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			if (uploadedFiles.length > 0) {
				await trx
					.insertInto("taskFiles")
					.values(
						uploadedFiles.map(({ fileName, fileId, fileUrl }) => ({
							fileId,
							fileUrl,
							fileName,
							taskId: task.id,
						})),
					)
					.execute();
			}

			return {
				...task,
				category: category.category,
				subcategory: category.subcategory,
				files: uploadedFiles,
			};
		});

		return result;
	}

	async update(
		userId: User["id"],
		updateTaskRequestDto: UpdateTaskRequestDto,
		updateTaskRequestParamsDto: UpdateTaskRequestParamsDto,
		log: LoggerService,
		files?: Express.Multer.File[],
	): Promise<Omit<TaskReturn, "creator" | "views">> {
		log.info({ userId }, "Updating task");

		if (
			Object.keys(updateTaskRequestDto).length === 0 &&
			(!files || files.length === 0)
		) {
			log.warn("No data provided for update");
			throw new BadRequestError("No data provided for update");
		}

		const {
			categoryId,
			subCategoryId,
			description,
			title,
			price,
			notifyAboutReplies,
		} = updateTaskRequestDto;

		const task = await this.getTaskBaseQuery()
			.select(["notifyAboutReplies"])
			.where("task.id", "=", updateTaskRequestParamsDto.taskId)
			.where("clientId", "=", userId)
			.executeTakeFirst();

		if (!task) {
			log.warn({ taskId: updateTaskRequestParamsDto.taskId }, "Task not found");
			throw new NotFoundError(
				`Task with id ${updateTaskRequestParamsDto.taskId} not found`,
			);
		}

		const isNewCategory = Number(categoryId) && Number(subCategoryId);

		let category:
			| {
					category: string;
					subcategory: string;
			  }
			| undefined;

		if (isNewCategory) {
			category = await this._database
				.selectFrom("category")
				.innerJoin(
					"category as subcategory",
					"category.id",
					"subcategory.parentId",
				)
				.select([
					"category.name as category",
					"subcategory.name as subcategory",
				])
				.where("category.id", "=", Number(categoryId))
				.where("subcategory.id", "=", Number(subCategoryId))
				.where("subcategory.parentId", "=", Number(categoryId))
				.executeTakeFirst();

			if (!category) {
				log.warn(
					{
						categoryId,
						subCategoryId,
					},
					"Category or subcategory not found",
				);
				throw new BadRequestError("Category or subcategory not found");
			}
		}

		if (files && task.files.length + files.length > TASK_FILES_MAX_COUNT) {
			log.warn(`Task file count exceeds limit (${TASK_FILES_MAX_COUNT})`);
			throw new BadRequestError(
				`Maximum files for task is ${TASK_FILES_MAX_COUNT}`,
			);
		}

		const uploadedFiles: FileUploadResponse[] = await uploadFiles(
			this._fileUploader,
			files,
			log,
		);

		const result = await this._database.transaction().execute(async (trx) => {
			const updateData = {
				...(description && {
					description,
				}),
				...(title && {
					title,
				}),
				...(Number(price) && {
					price: Number(price),
				}),
				...(isNewCategory &&
					categoryId !== task.categoryId &&
					subCategoryId !== task.subcategoryId && {
						categoryId: Number(categoryId),
						subcategoryId: Number(subCategoryId),
					}),
				...(notifyAboutReplies !== undefined &&
					notifyAboutReplies !== null && {
						notifyAboutReplies:
							typeof notifyAboutReplies === "string"
								? notifyAboutReplies === "true"
								: Boolean(notifyAboutReplies),
					}),
			};

			let updatedTask: Task | undefined;

			if (Object.keys(updateData).length) {
				updatedTask = await trx
					.updateTable("task")
					.where("task.id", "=", updateTaskRequestParamsDto.taskId)
					.where("clientId", "=", userId)
					.set({ ...updateData, updatedAt: sql`NOW()` })
					.returningAll()
					.executeTakeFirstOrThrow();
			}

			if (uploadedFiles.length) {
				await trx
					.insertInto("taskFiles")
					.values(
						uploadedFiles.map(({ fileName, fileId, fileUrl }) => ({
							fileId,
							fileUrl,
							fileName,
							taskId: task.id,
						})),
					)
					.execute();
			}

			return {
				...(updatedTask || task),
				category: category?.category || task.categoryName,
				subcategory: category?.subcategory || task.subcategoryName,
				files: [...task.files, ...uploadedFiles],
			};
		});

		return result;
	}

	async deleteTask(
		userId: User["id"],
		deleteTaskRequestParamsDto: DeleteTaskRequestParamsDto,
		log: LoggerService,
	) {
		log.info(
			{ userId, taskId: deleteTaskRequestParamsDto.taskId },
			"Deleting task",
		);

		const task = await this._database
			.selectFrom("task")
			.leftJoin("taskFiles as tf", "tf.taskId", "task.id")
			.select(["task.id", "task.status"])
			.select(
				sql<Pick<TaskFiles, "fileId">[]>`COALESCE(
				json_agg(
					json_build_object(
					'fileId', tf.file_id
					)
				) FILTER (WHERE tf.file_id IS NOT NULL),
				'[]'
				)`.as("files"),
			)
			.where("clientId", "=", userId)
			.where("task.id", "=", deleteTaskRequestParamsDto.taskId)
			.groupBy(["task.id", "task.status"])
			.executeTakeFirst();

		if (!task) {
			log.warn("Task not found");
			throw new NotFoundError(
				`Task with id ${deleteTaskRequestParamsDto.taskId} not found`,
			);
		}

		if (task.status !== TaskStatus.Open) {
			log.warn(
				`Task can't be deleted because it's has status ${TaskStatus.Completed} or ${TaskStatus.InProgress}`,
			);
			throw new BadRequestError(
				`Task can't be deleted because it's has status ${TaskStatus.Completed} or ${TaskStatus.InProgress}`,
			);
		}

		await Promise.all([
			this._database.deleteFrom("task").where("id", "=", task.id).execute(),
			...task.files.map((file) => this._fileUploader.deleteFile(file.fileId)),
		]);
	}

	async deleteTaskFile(
		userId: User["id"],
		{ taskId, fileId }: DeleteTaskFilesRequestParamsDto,
		log: LoggerService,
	): Promise<Omit<TaskReturn, "creator">> {
		log.info({ userId, fileId }, "Deleting task files");

		const task = await this.getTaskBaseQuery()
			.where("task.id", "=", taskId)
			.where("clientId", "=", userId)
			.executeTakeFirst();

		if (!task) {
			log.warn("Task not found");
			throw new NotFoundError(`Task with id ${taskId} not found`);
		}

		if (!task.files.length) {
			log.warn("Task has no files");
			throw new BadRequestError("Task has no files");
		}

		const fileToDelete = task.files.find((f) => f.fileId === fileId);
		if (!fileToDelete) {
			log.warn("File not found");
			throw new NotFoundError(`File with id ${fileId} not found`);
		}

		await this._fileUploader.deleteFile(fileToDelete.fileId);
		await this._database
			.deleteFrom("taskFiles")
			.where("fileId", "=", fileToDelete.fileId)
			.where("taskId", "=", task.id)
			.execute();

		return {
			...task,
			category: task.categoryName,
			subcategory: task.subcategoryName,
			files: task.files.filter((f) => f.fileId !== fileToDelete.fileId),
		};
	}

	async incrementTaskView(userId: User["id"], taskId: Task["id"]) {
		try {
			await this._database
				.insertInto("taskViews")
				.values({
					taskId,
					userId,
				})
				.execute();
		} catch (e) {
			if (isDatabaseError(e) && e.constraint === "task_views_task_id_user_id") {
				return;
			}

			throw e;
		}
	}

	async createTaskReply(
		userId: User["id"],
		createTaskReplyRequestDto: CreateTaskReplyRequestDto,
		createTaskReplyRequestParamsDto: CreateTaskReplyRequestParamsDto,
		log: LoggerService,
	) {
		log.info({ userId }, "Creating task reply");

		const task = await this._database
			.selectFrom("task")
			.innerJoin("users", "users.id", "task.clientId")
			.select(["task.id", "status", "title", "users.email"])
			.where("task.id", "=", createTaskReplyRequestParamsDto.taskId)
			.executeTakeFirst();

		if (!task || task.status !== TaskStatus.Open) {
			log.warn(
				!task ? "Task not found" : `Task status is not "${TaskStatus.Open}"`,
			);
			throw !task
				? new NotFoundError("Task not found")
				: new BadRequestError(`Task status is not "${TaskStatus.Open}"`);
		}

		const taskReply = await this._database
			.selectFrom("taskReplies")
			.where("freelancerId", "=", userId)
			.where("taskId", "=", createTaskReplyRequestParamsDto.taskId)
			.executeTakeFirst();

		if (taskReply) {
			log.warn("Task reply already exists");
			throw new BadRequestError("Task reply already exists");
		}

		await this._database
			.insertInto("taskReplies")
			.values({
				createdAt: sql`NOW()`,
				freelancerId: userId,
				taskId: createTaskReplyRequestParamsDto.taskId,
				description: createTaskReplyRequestDto.description,
			})
			.execute();

		this._emailService.sendTaskReplyEmail(task.email, task.title, log);
	}

	async getMyTaskReplies(
		userId: User["id"],
		getMyTaskRepliesRequestParamsDto: GetMyTaskRepliesRequestParamsDto,
		getMyTaskRepliesRequestQueryDto: GetMyTaskRepliesRequestQueryDto,
		log: LoggerService,
	): Promise<{ replies: MyTaskRepliesReturn[]; totalCount: number }> {
		log.info({ userId }, "Getting my task replies");

		const limit =
			Number(getMyTaskRepliesRequestQueryDto.limit) ||
			GET_TASK_REPLIES_MAX_LIMIT;
		const page = Number(getMyTaskRepliesRequestQueryDto.page) || 1;

		const task = await this._database
			.selectFrom("task")
			.select(["id"])
			.where("clientId", "=", userId)
			.where("id", "=", getMyTaskRepliesRequestParamsDto.taskId)
			.executeTakeFirst();

		if (!task) {
			log.warn("Task not found");
			throw new NotFoundError("Task not found");
		}

		const taskReplies = await this._database
			.selectFrom("taskReplies")
			.innerJoin("users", "users.id", "taskReplies.freelancerId")
			.select([
				"taskReplies.id",
				"taskReplies.description",
				"taskReplies.createdAt",
				"taskReplies.freelancerId",
				"users.firstName",
				"users.lastName",
				"users.avatar",
			])
			.select(sql<number>`COUNT(*) OVER()::INTEGER`.as("totalCount"))
			.where("taskId", "=", task.id)
			.orderBy("createdAt", "desc")
			.limit(limit)
			.offset(page * limit - limit)
			.execute();

		return {
			replies: taskReplies.map((t) => ({
				id: t.id,
				description: t.description,
				createdAt: t.createdAt,
				freelancer: {
					id: t.freelancerId,
					firstName: t.firstName,
					lastName: t.lastName,
					avatar: t.avatar,
				},
			})),
			totalCount: taskReplies[0]?.totalCount,
		};
	}

	async getTasksByMyReplies(
		userId: User["id"],
		getTasksByMyRepliesRequestQueryDto: GetTasksByMyRepliesRequestQueryDto,
		log: LoggerService,
	): Promise<{
		tasks: TaskReturn[];
		totalCount: number;
	}> {
		log.info({ userId }, "Getting tasks by my replies");

		const limit =
			Number(getTasksByMyRepliesRequestQueryDto.limit) ||
			GET_TASKS_DEFAULT_LIMIT;
		const page =
			Number(getTasksByMyRepliesRequestQueryDto.page) || GET_TASKS_DEFAULT_PAGE;

		const tasks = await this.getTaskBaseQuery()
			.innerJoin("taskReplies", "taskReplies.taskId", "task.id")
			.where("taskReplies.freelancerId", "=", userId)
			.select(sql<number>`COUNT(*) OVER()::INTEGER`.as("totalCount"))
			.$if(!!getTasksByMyRepliesRequestQueryDto.status, (qb) =>
				qb.where(
					"task.status",
					"=",
					getTasksByMyRepliesRequestQueryDto.status!,
				),
			)
			.groupBy("taskReplies.createdAt")
			.orderBy("taskReplies.createdAt", "desc")
			.limit(limit)
			.offset(page * limit - limit)
			.execute();

		return {
			tasks: tasks.map((t) => ({
				...t,
				category: t.categoryName,
				subcategory: t.subcategoryName,
				creator: `${t.firstName} ${t.lastName}`,
			})),
			totalCount: tasks[0]?.totalCount || 0,
		};
	}

	private getTaskBaseQuery() {
		return this._database
			.selectFrom("task")
			.innerJoin("category", "category.id", "task.categoryId")
			.leftJoin(
				"category as subcategory",
				"subcategory.id",
				"task.subcategoryId",
			)
			.leftJoin("taskFiles as tf", "tf.taskId", "task.id")
			.innerJoin("users", "users.id", "task.clientId")
			.select([
				"task.id",
				"task.title",
				"task.price",
				"task.description",
				"task.clientId",
				"task.freelancerId",
				"task.status",
				"task.categoryId",
				"task.subcategoryId",
				"task.createdAt",
				"task.updatedAt",
				"category.name as categoryName",
				"subcategory.name as subcategoryName",
				"users.firstName",
				"users.lastName",
			])
			.select(
				sql<Pick<TaskFiles, "fileId" | "fileUrl" | "fileName">[]>`COALESCE(
				json_agg(
					json_build_object(
					'fileId', tf.file_id,
					'fileUrl', tf.file_url,
					'fileName', tf.file_name
					)
				) FILTER (WHERE tf.file_id IS NOT NULL),
				'[]'
				)`.as("files"),
			)
			.select(
				sql<number>`(SELECT COUNT(*)::INTEGER FROM task_views WHERE task_id = task.id)`.as(
					"views",
				),
			)
			.groupBy([
				"task.id",
				"category.name",
				"subcategory.name",
				"users.firstName",
				"users.lastName",
			]);
	}
}
