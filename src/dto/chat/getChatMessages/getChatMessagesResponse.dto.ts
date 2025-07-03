import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { Message } from "../../../storage/postgres/types/messages.type.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         chatId:
 *           type: string
 *           example: "abc123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-03T10:00:00Z"
 *         files:
 *           type: array
 *           items:
 *             type: string
 *           example: ["file1.png", "file2.pdf"]
 *         id:
 *           type: integer
 *           example: 42
 *         isRead:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Hello, how are you?"
 *         senderId:
 *           type: string
 *           format: uuid
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-07-03T10:05:00Z"
 *
 *     GetChatMessagesResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 totalCount:
 *                   type: number
 *                   example: 100
 */
export type GetChatMessagesResponseDto = SuccessResponseDto<{
	messages: Message[];
	totalCount: number;
}>;
