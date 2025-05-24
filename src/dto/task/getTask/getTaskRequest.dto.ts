import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const getTaskSchema = vine.object({
	taskId: vine.number().positive(),
});

export type GetTaskRequestDto = InferInput<typeof getTaskSchema>;
