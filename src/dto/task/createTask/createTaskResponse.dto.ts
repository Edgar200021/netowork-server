import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { TaskResponseDto } from "../taskResponse.dto.js";

///**
// * @openapi
// * components:
// *   schemas:
// *     CreateWorkResponseDto:
// *       allOf:
// *         - $ref: '#/components/schemas/SuccessResponseDto'
// *         - type: object
// *           properties:
// *             data:
// *               $ref: '#/components/schemas/WorkResponseDto'
// */

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateTaskResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/TaskResponseDto'
 */
export type CreateTaskResponseDto = SuccessResponseDto<TaskResponseDto>;
