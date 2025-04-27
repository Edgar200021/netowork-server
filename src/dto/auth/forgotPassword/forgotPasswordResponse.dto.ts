import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: string
 */
export type ForgotPasswordResponseDto = SuccessResponseDto<string>;
