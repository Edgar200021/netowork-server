import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import { GET_CHATS_MAX_LIMIT } from "../../../const/validator.js";

export const getChatsRequestQuerySchema = vine.object({
	limit: vine.number().min(1).max(GET_CHATS_MAX_LIMIT).optional(),
	page: vine.number().min(1).optional(),
});

export type GetChatsRequestQueryDto = InferInput<
	typeof getChatsRequestQuerySchema
>;
