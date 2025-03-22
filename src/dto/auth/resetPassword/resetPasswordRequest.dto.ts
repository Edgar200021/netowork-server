import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'
import { MIN_PASSWORD_LENGTH } from '../../../const/validator.js'

/**
 * @openapi
 * components:
 *   schemas:
 *     ResetPasswordRequestDto:
 *       type: object
 *       required:
 *         - token
 *         - password
 *         - passwordConfirmation
 *       properties:
 *         token:
 *           type: string
 *         password:
 *           type: string
 *           minLength: 8
 *           default: "password"
 *         passwordConfirmation:
 *           type: string
 * 
 */
export const resetPasswordSchema = vine.object({
  token: vine.string(),
  password: vine.string().minLength(MIN_PASSWORD_LENGTH).confirmed({
    confirmationField: 'passwordConfirmation',
  }),
})

export type ResetPasswordRequestDto = InferInput<typeof resetPasswordSchema>
