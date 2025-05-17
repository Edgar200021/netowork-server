import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { TaskResponseDto } from "../taskResponse.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateTaskResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/TaskResponseDto'
 */
export type UpdateTaskResponseDto = SuccessResponseDto<TaskResponseDto>;
