import type { Category } from "../../storage/postgres/types/category.type.js";
import type { Task } from "../../storage/postgres/types/task.type.js";
import type { User } from "../../storage/postgres/types/user.types.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     TaskResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1
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
 */

export class TaskResponseDto {
	readonly id: number;
	readonly createdAt: Date;
	readonly title: string;
	readonly description: string;
	readonly category: Category["name"];
	readonly subCategory: Category["name"];
	readonly price: number;
	readonly creator: `${User["firstName"]} ${User["lastName"]}`;
	readonly files: string[]

	constructor(
		task: Task & {
			creator: `${User["firstName"]} ${User["lastName"]}`;
			category: Category["name"];
			subcategory: Category["name"];
		},
	) {
		this.id = task.id;
		this.createdAt = task.createdAt;
		this.title = task.title;
		this.description = task.description;
		this.category = task.category;
		this.subCategory = task.subcategory;
		this.price = task.price;
		this.creator = task.creator;
		this.files = task.fileUrls
	}
}
