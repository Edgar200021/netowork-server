import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import { GET_ALL_TASKS_MAX_LIMIT } from "../../../const/validator.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetAllTasksRequestDto:
 *       type: object
 *       properties:
 *         limit:
 *           type: number
 *           max: 100
 *         page:
 *           type: number
 */
export const getAllTasksSchema = vine.object({
	limit: vine.number().positive().max(GET_ALL_TASKS_MAX_LIMIT).optional(),
	page: vine.number().positive().optional(),
});

export type GetAllTasksRequestDto = InferInput<typeof getAllTasksSchema>;
