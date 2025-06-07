import type { InferInput } from "@vinejs/vine/types";
import { getMyTasksRequestQuerySchema } from "../getMyTasks/getMyTasksRequest.dto.js";

export const getTasksByMyRepliesRequestQuerySchema =
	getMyTasksRequestQuerySchema.clone();

export type GetTasksByMyRepliesRequestQueryDto = InferInput<
	typeof getTasksByMyRepliesRequestQuerySchema
>;
