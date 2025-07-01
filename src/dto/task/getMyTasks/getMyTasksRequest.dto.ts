import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import { GET_ALL_TASKS_MAX_LIMIT } from "../../../const/validator.js";
import { TaskStatus } from "../../../storage/db.js";

export const getMyTasksRequestQuerySchema = vine.object({
	limit: vine.number().min(1).max(GET_ALL_TASKS_MAX_LIMIT).optional(),
	page: vine.number().min(1).optional(),
	status: vine.enum(TaskStatus).optional(),
});

export type GetMyTasksRequestQueryDto = InferInput<
	typeof getMyTasksRequestQuerySchema
>;
