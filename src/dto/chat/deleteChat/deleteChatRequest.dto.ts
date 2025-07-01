import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

export const deleteChatRequestParamsSchema = vine.object({
	chatId: vine.string().uuid(),
});

export type DeleteChatRequestParamsDto = InferInput<
	typeof deleteChatRequestParamsSchema
>;
