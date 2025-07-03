import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const getChatMessagesRequestParamsSchema = vine.object({
	chatId: vine.string().trim().uuid(),
	// limit: vine.number().min(1).max(GET_CHATS_MAX_LIMIT).optional(),
	// page: vine.number().min(1).optional(),
});

export type GetChatMessagesRequestParamsDto = InferInput<
	typeof getChatMessagesRequestParamsSchema
>;
