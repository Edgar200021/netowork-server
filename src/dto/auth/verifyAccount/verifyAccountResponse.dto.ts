import type { SuccessResponseDto } from '../../../common/dto/base.dto.js'
import type { UserResponseDto } from '../../users/user-response.dto.js'

/**
 * @openapi
 * components:
 *   schemas:
 *     VerifyAccountResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/UserResponseDto'
 */
export type VerifyAccountResponseDto = SuccessResponseDto<UserResponseDto>
