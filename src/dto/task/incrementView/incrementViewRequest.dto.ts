import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const incrementTaskViewRequestParamsSchema = vine.object({
	taskId: vine.string().uuid(),
});

export type IncrementTaskViewRequestParamsDto = InferInput<
	typeof incrementTaskViewRequestParamsSchema
>;
