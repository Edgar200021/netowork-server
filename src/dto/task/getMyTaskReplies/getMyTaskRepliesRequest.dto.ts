import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import { GET_TASK_REPLIES_MAX_LIMIT } from "../../../const/validator.js";

export const getMyTaskRepliesRequestQuerySchema = vine.object({
	limit: vine.number().positive().max(GET_TASK_REPLIES_MAX_LIMIT).optional(),
	page: vine.number().positive().optional(),
});

export const getMyTaskRepliesRequestParamsSchema = vine.object({
	taskId: vine.string().uuid(),
});

export type GetMyTaskRepliesRequestQueryDto = InferInput<
	typeof getMyTaskRepliesRequestQuerySchema
>;
export type GetMyTaskRepliesRequestParamsDto = InferInput<
	typeof getMyTaskRepliesRequestParamsSchema
>;
