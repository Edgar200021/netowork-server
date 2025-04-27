import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { WorkResponseDto } from "../workResponse.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateWorkResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/WorkResponseDto'
 */
export type CreateWorkResponseDto = SuccessResponseDto<WorkResponseDto>;
