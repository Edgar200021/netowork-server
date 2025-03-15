import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'
import { MIN_PASSWORD_LENGTH } from '../../../const/validator.js'

/**
 * @openapi
 * components:
 *   schemas:
 *     ForgotPasswordRequestDto:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           default: "6L2W9@example.com"
 */
export const forgotPasswordSchema = vine.object({
  email: vine.string().email(),
})

export type ForgotPasswordRequestDto = InferInput<typeof forgotPasswordSchema>
