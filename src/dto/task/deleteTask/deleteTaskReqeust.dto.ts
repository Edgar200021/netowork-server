import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const deleteTaskRequestParamsSchema = vine.object({
	taskId: vine.number().positive(),
});

export type DeleteTaskRequestParamsDto = InferInput<
	typeof deleteTaskRequestParamsSchema
>;
