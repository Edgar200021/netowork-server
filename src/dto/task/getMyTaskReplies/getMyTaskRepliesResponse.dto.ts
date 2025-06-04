import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { MyTaskRepliesResponseDto } from "../myTaskRepliesResponse.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetMyTaskRepliesResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 replies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MyTaskRepliesResponseDto'
 *                 totalCount:
 *                   type: number
 */
export type GetMyTaskRepliesResponseDto = SuccessResponseDto<{
	totalCount: number;
	replies: MyTaskRepliesResponseDto[];
}>;
