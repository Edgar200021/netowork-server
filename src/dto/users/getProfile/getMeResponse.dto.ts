import type { SuccessResponseDto } from "../../../common/dto/base.dto.js";
import type { UserResponseDto } from "../userResponse.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     GetMeResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/UserResponseDto'
 */
export type GetProfileResponseDto = SuccessResponseDto<UserResponseDto>;
