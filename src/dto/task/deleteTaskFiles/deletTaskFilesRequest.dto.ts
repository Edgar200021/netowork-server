import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const deleteTaskFilesRequestParamsSchema = vine.object({
	taskId: vine.number().positive(),
	fileId: vine.string(),
});

export type DeleteTaskFilesRequestParamsDto = InferInput<
	typeof deleteTaskFilesRequestParamsSchema
>;
