import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { TaskResponseDto } from "../taskResponse.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetMyTasksResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaskResponseDto'
 */
export type GetMyTasksResponseDto = SuccessResponseDto<TaskResponseDto[]>;
