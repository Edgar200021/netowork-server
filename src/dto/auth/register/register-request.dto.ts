import vine from '@vinejs/vine'
import {
  MAX_FIRST_NAME_LENGTH,
  MAX_LAST_NAME_LENGTH,
  MIN_FIRST_NAME_LENGTH,
  MIN_LAST_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '../../../const/validator.js'
import type { UserRole } from '../../../storage/db.js'
import type { InferInput } from '@vinejs/vine/types'

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