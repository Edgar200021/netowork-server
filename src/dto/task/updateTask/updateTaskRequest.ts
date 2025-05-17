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
 *     UpdateTaskRequestDto:
 *       type: object
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
export const updateTaskRequest = vine.object({
	title: vine
		.string()
		.trim()
		.minLength(MIN_TASK_TITLE_LENGTH)
		.maxLength(MAX_TASK_TITLE_LENGTH)
		.optional(),
	description: vine
		.string()
		.trim()
		.minLength(MIN_TASK_DESCRIPTION_LENGTH)
		.maxLength(MAX_TASK_DESCRIPTION_LENGTH)
		.optional(),
	categoryId: vine.number().positive().optional(),
	subCategoryId: vine.number().positive().optional(),
	price: vine.number().positive().optional(),
});

export const updateTaskRequestParams = vine.object({
	taskId: vine.number()
})


export type UpdateTaskRequestDto = InferInput<typeof updateTaskRequest>;
export type UpdateTaskRequestParamsDto = InferInput<typeof updateTaskRequestParams>
