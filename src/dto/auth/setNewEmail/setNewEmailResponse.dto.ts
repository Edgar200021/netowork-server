import type { SuccessResponseDto } from "../../../services/common/dto/base.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     SetNewEmailResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: string
 */
export type SetNewEmailResponseDto = SuccessResponseDto<string>;
