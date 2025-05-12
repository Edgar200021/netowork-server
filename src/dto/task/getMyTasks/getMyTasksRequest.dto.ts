import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import { GET_ALL_TASKS_MAX_LIMIT } from "../../../const/validator.js";
import { TaskStatus } from "../../../storage/db.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetMyTasksRequestDto:
 *       type: object
 *       properties:
 *         limit:
 *           type: number
 *           max: 100
 *         page:
 *           type: number
 *         status:
 *           type: string
 *           enum: [completed, in_progress, open]
 */
export const getMyTasksSchema = vine.object({
	limit: vine.number().positive().max(GET_ALL_TASKS_MAX_LIMIT).optional(),
	page: vine.number().positive().optional(),
	status: vine
		.enum(TaskStatus)
		.optional(),
});

export type GetMyTasksRequestDto = InferInput<typeof getMyTasksSchema>;
