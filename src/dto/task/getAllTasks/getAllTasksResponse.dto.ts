import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { TaskResponseDto } from "../taskResponse.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetAllTasksResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskResponseDto'
 *                 totalCount:
 *                   type: number
 */
export type GetAllTasksResponseDto = SuccessResponseDto<{
	tasks: TaskResponseDto[],
	totalCount: number
}>;
