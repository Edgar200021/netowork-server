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
 *           minimum: 0
 *         notifyAboutReplies:
 *           type: boolean
 */
export const updateTaskRequestSchema = vine.object({
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
	categoryId: vine.number().min(1).optional(),
	subCategoryId: vine.number().min(1).optional(),
	price: vine.number().min(1).optional(),
	notifyAboutReplies: vine.boolean().optional(),
});

export const updateTaskRequestParamsSchema = vine.object({
	taskId: vine.string().uuid(),
});

export type UpdateTaskRequestDto = InferInput<typeof updateTaskRequestSchema>;
export type UpdateTaskRequestParamsDto = InferInput<
	typeof updateTaskRequestParamsSchema
>;
