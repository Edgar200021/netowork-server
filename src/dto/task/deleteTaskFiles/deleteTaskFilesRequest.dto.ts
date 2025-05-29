import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const deleteTaskFilesRequestParamsSchema = vine.object({
	taskId: vine.string().uuid(),
	fileId: vine.string(),
});

export type DeleteTaskFilesRequestParamsDto = InferInput<
	typeof deleteTaskFilesRequestParamsSchema
>;
