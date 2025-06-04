import type { SuccessResponseDto } from '../../../common/dto/base.dto.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateTaskReplyResponseDto:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponseDto'
 *         - type: object
 *           properties:
 *             data:
 *               type: null
 */
export type CreateTaskReplyResponseDto = SuccessResponseDto<null>