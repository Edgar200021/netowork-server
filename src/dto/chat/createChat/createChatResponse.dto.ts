import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { ChatResponseDto } from "../chatResponseDto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateChatResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: string
 *               format: uuid
 */
export type CreateChatResponseDto = SuccessResponseDto<string>;
