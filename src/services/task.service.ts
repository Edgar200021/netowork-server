import { sql } from "kysely";
import path from "node:path";
import { BadRequestError, NotFoundError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import { TASK_FILES_MAX_COUNT } from "../const/multer.js";
import {
	GET_TASKS_DEFAULT_LIMIT,
	GET_TASKS_DEFAULT_PAGE,
} from "../const/task.js";
import type { CreateTaskRequestDto } from "../dto/task/createTask/createTaskRequest.dto.js";
import type { DeleteTaskRequestParamsDto } from "../dto/task/deleteTask/deleteTaskReqeust.dto.js";
import type { DeleteTaskFilesRequestParamsDto } from "../dto/task/deleteTaskFiles/deletTaskFilesRequest.dto.js";
import type { GetAllTasksRequestDto } from "../dto/task/getAllTasks/getAllTasksRequest.dto.js";
import type { GetMyTasksRequestDto } from "../dto/task/getMyTasks/getMyTasksRequest.dto.js";
import type {
	UpdateTaskRequestDto,
	UpdateTaskRequestParamsDto,
} from "../dto/task/updateTask/updateTaskRequest.js";
import { type TaskFiles, TaskStatus } from "../storage/db.js";
import type { Database } from "../storage/postgres/database.js";
import type { Category } from "../storage/postgres/types/category.type.js";
import type { Task } from "../storage/postgres/types/task.type.js";
import type { User } from "../storage/postgres/types/user.types.js";
import type { FileUploadResponse } from "../types/cloudinary.js";
import { AllowedMimeTypes } from "../types/mimeTypes.js";
import type { FileUploader } from "./fileUploader.service.js";

export class TaskService {
	constructor(
		private readonly _database: Database,
		private readonly _fileUploader: FileUploader,
	) {}

	async getAllTasks(
		getAllTasksRequestDto: GetAllTasksRequestDto,
		log: LoggerService,
	): Promise<
		(Task & {
			category: Category["name"];
			subcategory: Category["name"] | null;
			creator: `${User["firstName"]} ${User["lastName"]}`;
			files: Pick<TaskFiles, "fileId" | "fileUrl" | "fileName">[];
		})[]
	> {
		log.info("Getting all tasks");

		const limit =
			Number(getAllTasksRequestDto.limit) || GET_TASKS_DEFAULT_LIMIT;
		const page = Number(getAllTasksRequestDto.page) || GET_TASKS_DEFAULT_PAGE;

		const tasks = await this._database
			.selectFrom("task")
			.innerJoin("category", "task.categoryId", "category.id")
			.leftJoin(
				"category as subcategory",
				"task.subcategoryId",
				"subcategory.id",
			)
			.leftJoin("taskFiles as tf", "tf.taskId", "task.id")
			.innerJoin("users", "task.clientId", "users.id")
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
			.where("status", "=", TaskStatus.Open)
			.orderBy("task.id")
			.groupBy([
				"task.id",
				"category.name",
				"subcategory.name",
				"users.firstName",
				"users.lastName",
			])
			.limit(limit)
			.offset((page - 1) * limit)
			.execute();

		return tasks.map((t) => ({
			...t,
			category: t.categoryName,
			subcategory: t.subcategoryName,
			creator: `${t.firstName} ${t.lastName}`,
		}));
	}

	async getMyTasks(
		userId: User["id"],
		getMyTasksRequestDto: GetMyTasksRequestDto,
		log: LoggerService,
	): Promise<
		(Task & {
			category: Category["name"];
			subcategory: Category["name"] | null;
			creator: `${User["firstName"]} ${User["lastName"]}`;
			files: Pick<TaskFiles, "fileId" | "fileUrl" | "fileName">[];
		})[]
	> {
		log.info({ userId }, "Getting my tasks");

		const limit = Number(getMyTasksRequestDto.limit) || GET_TASKS_DEFAULT_LIMIT;
		const page = Number(getMyTasksRequestDto.page) || GET_TASKS_DEFAULT_PAGE;

		let tasksQuery = this._database
			.selectFrom("task")
			.innerJoin("category", "task.categoryId", "category.id")
			.leftJoin(
				"category as subcategory",
				"task.subcategoryId",
				"subcategory.id",
			)
			.leftJoin("taskFiles as tf", "tf.taskId", "task.id")
			.innerJoin("users", "task.clientId", "users.id")
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

			.where("clientId", "=", userId)
			.groupBy([
				"task.id",
				"category.name",
				"subcategory.name",
				"users.firstName",
				"users.lastName",
			])
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

		return tasks.map((t) => ({
			...t,
			category: t.categoryName,
			subcategory: t.subcategoryName,
			creator: `${t.firstName} ${t.lastName}`,
		}));
	}

	async create(
		userId: User["id"],
		createTaskRequestDto: CreateTaskRequestDto,
		log: LoggerService,
		files?: Express.Multer.File[],
	): Promise<
		Task & {
			category: Category["name"];
			subcategory: Category["name"] | null;
			files: Pick<TaskFiles, "fileId" | "fileUrl">[];
		}
	> {
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

		const uploadedFiles: FileUploadResponse[] = await this.uploadFiles(
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
	): Promise<
		Task & {
			category: Category["name"];
			subcategory: Category["name"] | null;
			files: Pick<TaskFiles, "fileId" | "fileUrl">[];
		}
	> {
		log.info({ userId }, "Updating task");

		if (
			Object.keys(updateTaskRequestDto).length === 0 &&
			(!files || files.length === 0)
		) {
			log.warn("No data provided for update");
			throw new BadRequestError("No data provided for update");
		}

		const { categoryId, subCategoryId, description, title, price } =
			updateTaskRequestDto;

		const task = await this._database
			.selectFrom("task")
			.innerJoin("category", "task.categoryId", "category.id")
			.leftJoin(
				"category as subcategory",
				"task.subcategoryId",
				"subcategory.id",
			)
			.leftJoin("taskFiles as tf", "tf.taskId", "task.id")
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
			.groupBy(["task.id", "category.name", "subcategory.name"])
			.where("task.id", "=", Number(updateTaskRequestParamsDto.taskId))
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

		const uploadedFiles: FileUploadResponse[] = await this.uploadFiles(
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
			};

			let updatedTask: Task | undefined;

			if (Object.keys(updateData).length) {
				updatedTask = await trx
					.updateTable("task")
					.where("task.id", "=", Number(updateTaskRequestParamsDto.taskId))
					.where("clientId", "=", userId)
					.set(updateData)
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
			.where("task.id", "=", Number(deleteTaskRequestParamsDto.taskId))
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
	): Promise<
		Task & {
			category: Category["name"];
			subcategory: Category["name"] | null;
			files: Pick<TaskFiles, "fileId" | "fileUrl">[];
		}
	> {
		log.info({ userId, fileId }, "Deleting task files");

		const task = await this._database
			.selectFrom("task")
			.innerJoin("category", "task.categoryId", "category.id")
			.leftJoin(
				"category as subcategory",
				"task.subcategoryId",
				"subcategory.id",
			)
			.leftJoin("taskFiles as tf", "tf.taskId", "task.id")
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
			.groupBy(["task.id", "category.name", "subcategory.name"])
			.where("task.id", "=", Number(taskId))
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

	private async uploadFiles(
		files: Express.Multer.File[] | undefined,
		log: LoggerService,
	): Promise<FileUploadResponse[]> {
		if (files) {
			const result = await Promise.all(
				files.map(async (file) => {
					const res = await this._fileUploader.uploadFileFromBuffer(
						file.buffer,
						log,
						{
							format: path.extname(file.originalname).slice(1),
							...(file.mimetype ===
								AllowedMimeTypes[
									"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
								] || file.mimetype === AllowedMimeTypes["text/plain"]
								? {
										resource_type: "raw",
									}
								: {}),
							filename_override: file.originalname,
						},
					);

					return res;
				}),
			);

			return result.reduce((acc, val) => {
				acc.push(val);
				return acc;
			}, [] as FileUploadResponse[]);
		}

		return [];
	}
}
