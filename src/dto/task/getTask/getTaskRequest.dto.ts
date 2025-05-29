import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const getTaskRequestParamsSchema = vine.object({
	taskId: vine.string().uuid(),
});

export type GetTaskRequestParamsDto = InferInput<
	typeof getTaskRequestParamsSchema
>;
