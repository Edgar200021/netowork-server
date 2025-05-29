import type { TaskFiles, TaskStatus } from "../../storage/db.js";
import type { Category } from "../../storage/postgres/types/category.type.js";
import type { Task } from "../../storage/postgres/types/task.type.js";
import type { User } from "../../storage/postgres/types/user.types.js";
import type { TaskReturn } from "../../types/tasks.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     TaskResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426655440000"
 *         title:
 *           type: string
 *           example: Task title
 *         description:
 *           type: string
 *           example: Task description
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
 *         category:
 *           type: string
 *           example: Category name
 *         subCategory:
 *           type: string
 *           example: Subcategory name
 *         price:
 *           type: number
 *           example: 100.00
 *         creator:
 *           type: string
 *           example: "John Doe"
 *         files:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileName:
 *                 type: string
 *         status:
 *           type: enum
 *           enum: [in_progress, completed, open]
 *           example: in_progress
 *         views:
 *           type: number
 */

export class TaskResponseDto {
	readonly id: string;
	readonly createdAt: Date;
	readonly title: string;
	readonly description: string;
	readonly category: Category["name"];
	readonly subCategory: Category["name"] | null;
	readonly price: number;
	readonly creator: `${User["firstName"]} ${User["lastName"]}`;
	files: Pick<TaskFiles, "fileId" | "fileUrl" | "fileName">[];
	readonly status: TaskStatus;
	readonly views?: number;

	constructor(
		task: Omit<TaskReturn, "views"> & Partial<Pick<TaskReturn, "views">>,
	) {
		this.id = task.id;
		this.createdAt = task.createdAt;
		this.title = task.title;
		this.description = task.description;
		this.category = task.category;
		this.subCategory = task.subcategory;
		this.price = task.price;
		this.creator = task.creator;
		this.status = task.status;
		this.files = task.files;
		this.views = task.views;
	}
}
