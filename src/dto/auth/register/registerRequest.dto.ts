import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'
import {
  MAX_FIRST_NAME_LENGTH,
  MAX_LAST_NAME_LENGTH,
  MIN_FIRST_NAME_LENGTH,
  MIN_LAST_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '../../../const/validator.js'
import type { UserRole } from '../../../storage/db.js'

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterRequestDto:
 *       type: object
 *       required:
 *         - role
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - passwordConfirmation
 *       properties:
 *         role:
 *           type: string
 *           enum:
 *             - client
 *             - freelancer
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *           default: password
 *         passwordConfirmation:
 *           type: string
 *           minLength: 8
 *           default: password
 */
export const registerSchema = vine.object({
  role: vine.enum(['client', 'freelancer'] as Exclude<UserRole, 'admin'>[]),
  firstName: vine
    .string()
    .minLength(MIN_FIRST_NAME_LENGTH)
    .maxLength(MAX_FIRST_NAME_LENGTH),
  lastName: vine
    .string()
    .minLength(MIN_LAST_NAME_LENGTH)
    .maxLength(MAX_LAST_NAME_LENGTH),
  email: vine.string().email(),
  password: vine
    .string()
    .minLength(MIN_PASSWORD_LENGTH)
    .confirmed({ confirmationField: 'passwordConfirmation' }),
})

export type RegisterRequestDto = InferInput<typeof registerSchema>
