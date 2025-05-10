import path from "node:path";
import { BadRequestError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import {
	GET_TASKS_DEFAULT_LIMIT,
	GET_TASKS_DEFAULT_PAGE,
} from "../const/task.js";
import type { CreateTaskRequestDto } from "../dto/task/createTask/createTaskRequest.dto.js";
import type { GetAllTasksRequestDto } from "../dto/task/getAllTasks/getAllTasksRequest.dto.js";
import type { GetMyTasksRequestDto } from "../dto/task/getMyTasks/getMyTasksRequest.dto.js";
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
			subcategory: Category["name"];
			creator: `${User["firstName"]} ${User["lastName"]}`;
		})[]
	> {
		const limit =
			Number(getAllTasksRequestDto.limit) || GET_TASKS_DEFAULT_LIMIT;
		const page = Number(getAllTasksRequestDto.page) || GET_TASKS_DEFAULT_PAGE;

		const tasks = await this._database
			.selectFrom("task")
			.innerJoin("category", "task.categoryId", "category.id")
			.innerJoin(
				"category as subcategory",
				"task.subcategoryId",
				"subcategory.id",
			)
			.innerJoin("users", "task.clientId", "users.id")
			.select([
				"task.id",
				"task.title",
				"task.price",
				"task.description",
				"task.fileIds",
				"task.fileUrls",
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
			.where("status", "=", "open")
			.orderBy("task.id")
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
			subcategory: Category["name"];
			creator: `${User["firstName"]} ${User["lastName"]}`;
		})[]
	> {
		const limit = Number(getMyTasksRequestDto.limit) || GET_TASKS_DEFAULT_LIMIT;
		const page = Number(getMyTasksRequestDto.page) || GET_TASKS_DEFAULT_PAGE;

		const tasksQuery = await this._database
			.selectFrom("task")
			.innerJoin("category", "task.categoryId", "category.id")
			.innerJoin(
				"category as subcategory",
				"task.subcategoryId",
				"subcategory.id",
			)
			.innerJoin("users", "task.clientId", "users.id")
			.select([
				"task.id",
				"task.title",
				"task.price",
				"task.description",
				"task.fileIds",
				"task.fileUrls",
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
			.where("clientId", "=", userId)
			.limit(limit)
			.offset((page - 1) * limit);

		if (getMyTasksRequestDto.status) {
			tasksQuery.where("status", "=", getMyTasksRequestDto.status);
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
		Task & { category: Category["name"]; subcategory: Category["name"] }
	> {
		log.info({ userId }, "Creating task");

		const uploadedFiles: FileUploadResponse[] = [];
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
							]
								? {
										resource_type: "raw",
									}
								: {}),
						},
					);

					return res;
				}),
			);
			for (const res of result) {
				uploadedFiles.push(res);
			}
		}

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

		const task = await this._database
			.insertInto("task")
			.values({
				title: createTaskRequestDto.title,
				description: createTaskRequestDto.description,
				clientId: userId,
				categoryId: category.categoryId,
				subcategoryId: category.subCategoryId,
				price: Number(createTaskRequestDto.price),
				...(uploadedFiles.length > 0
					? {
							fileUrls: uploadedFiles.map((file) => file.fileUrl),
							fileIds: uploadedFiles.map((file) => file.fileId),
						}
					: {}),
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		return {
			...task,
			category: category.category,
			subcategory: category.subcategory,
		};
	}
}
