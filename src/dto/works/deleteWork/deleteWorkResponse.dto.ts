import type { SuccessResponseDto } from "../../../services/common/dto/base.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     DeleteWorkResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: string
 */
export type DeleteWorkResponseDto = SuccessResponseDto<string>;
