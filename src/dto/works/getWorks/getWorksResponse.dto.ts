import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { WorkResponseDto } from "../workResponse.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetWorksResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkResponseDto'
 */
export type GetWorksResponseDto = SuccessResponseDto<WorkResponseDto[]>;
