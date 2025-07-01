import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { ChatResponseDto } from "../chatResponse.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetChatsResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatResponseDto'
 *                 totalCount:
 *                   type: number
 */
export type GetChatsResponseDto = SuccessResponseDto<{
	chats: ChatResponseDto[];
	totalCount: number;
}>;
