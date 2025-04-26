import type { SuccessResponseDto } from "../../../services/common/dto/base.dto.js";
import type { CategoryResponseDto } from "../categoryResponse.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetAllCategoriesResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryResponseDto'
 */
export type GetAllCategoriesResponseDto = SuccessResponseDto<
	CategoryResponseDto[]
>;
