import type { SuccessResponseDto } from '../../../common/dto/base.dto.js'
import type { UserResponseDto } from '../../users/user-response.dto.js'

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
 *               $ref: '#/components/schemas/UserResponseDto'
 */
export type LoginResponseDto = SuccessResponseDto<UserResponseDto>
