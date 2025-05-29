import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const deleteWorkSchema = vine.object({
	id: vine.string(),
});

export type DeleteWorkRequestDto = InferInput<typeof deleteWorkSchema>;
