import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'

import { MAX_ABOUT_ME_LENGTH } from '../../../const/validator.js'

export const updateProfileSchema = vine.object({
  aboutMe: vine.string().maxLength(MAX_ABOUT_ME_LENGTH).optional(),
  email: vine.string().email().optional(),
})

export type UpdateProfileRequestDto = InferInput<typeof updateProfileSchema>
