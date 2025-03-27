import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import {
	MAX_WORK_TITLE_LENGTH,
	MIN_WORK_TITLE_LENGTH,
} from "../../../const/validator.js";

export const createWorkSchema = vine.object({
	title: vine
		.string()
		.trim()
		.minLength(MIN_WORK_TITLE_LENGTH)
		.maxLength(MAX_WORK_TITLE_LENGTH),
});

export type CreateWorkRequestDto = InferInput<typeof createWorkSchema>;
