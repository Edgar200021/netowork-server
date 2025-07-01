import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const deleteWorkRequestParamsSchema = vine.object({
	id: vine.string().uuid(),
});

export type DeleteWorkRequestParamsDto = InferInput<
	typeof deleteWorkRequestParamsSchema
>;
