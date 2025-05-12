import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import {
	MAX_TASK_DESCRIPTION_LENGTH,
	MAX_TASK_TITLE_LENGTH,
	MIN_TASK_DESCRIPTION_LENGTH,
	MIN_TASK_TITLE_LENGTH,
} from "../../../const/validator.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateTaskRequestDto:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - categoryId
 *         - subCategoryId
 *         - price
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 50
 *         description:
 *           type: string
 *           minLength: 100
 *           maxLength: 1000
 *         categoryId:
 *           type: number
 *         subCategoryId:
 *           type: number
 *         price:
 *           type: number
 */
export const createTaskSchema = vine.object({
	title: vine
		.string()
		.trim()
		.minLength(MIN_TASK_TITLE_LENGTH)
		.maxLength(MAX_TASK_TITLE_LENGTH),
	description: vine
		.string()
		.trim()
		.minLength(MIN_TASK_DESCRIPTION_LENGTH)
		.maxLength(MAX_TASK_DESCRIPTION_LENGTH),
	categoryId: vine.number().positive(),
	subCategoryId: vine.number().positive(),
	price: vine.number().positive(),
});

export type CreateTaskRequestDto = InferInput<typeof createTaskSchema>;
