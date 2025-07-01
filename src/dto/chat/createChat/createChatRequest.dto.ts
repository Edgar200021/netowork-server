import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateChatRequestDto:
 *       type: object
 *       required:
 *         - recipientId
 *       properties:
 *         recipiendId:
 *           type: string
 *           format: uuid
 */
export const createChatRequestSchema = vine.object({
	recipientId: vine.string().trim().uuid(),
});

export type CreateChatRequestDto = InferInput<typeof createChatRequestSchema>;
