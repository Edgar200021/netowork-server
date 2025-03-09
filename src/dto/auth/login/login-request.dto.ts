import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'
import { MIN_PASSWORD_LENGTH } from '../../../const/validator.js'

export const loginSchema = vine.object({
  email: vine.string().email(),
  password: vine.string().minLength(MIN_PASSWORD_LENGTH),
})

export type LoginRequestDto = InferInput<typeof loginSchema>
