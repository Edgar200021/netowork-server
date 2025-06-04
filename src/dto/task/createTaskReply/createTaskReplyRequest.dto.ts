import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import {
	MAX_TASK_REPLY_DESCRIPTION_LENGTH,
	MIN_TASK_REPLY_DESCRIPTION_LENGTH,
} from "../../../const/validator.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateTaskReplyRequestDto:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           minLength: 150
 *           maxLength: 1000
 */
export const createTaskReplyRequestSchema = vine.object({
	description: vine
		.string()
		.trim()
		.minLength(MIN_TASK_REPLY_DESCRIPTION_LENGTH)
		.maxLength(MAX_TASK_REPLY_DESCRIPTION_LENGTH)
});

export const createTaskReplyRequestParamsSchema = vine.object({
	taskId: vine.string().uuid(),
});

export type CreateTaskReplyRequestDto = InferInput<
	typeof createTaskReplyRequestSchema
>;
export type CreateTaskReplyRequestParamsDto = InferInput<
	typeof createTaskReplyRequestParamsSchema
>;
