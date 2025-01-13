import { z } from 'zod'
import { SuccessResponse } from '../base'

export const setNewEmailAddressRequestSchema = z.object({
  oldEmail: z.string().email('Некорректный email адрес'),
  newEmail: z.string().email('Некорректный email адрес'),
})

export type SetNewEmailAddressRequest = z.infer<
  typeof setNewEmailAddressRequestSchema
>
export type SetNewEmailAddressResponse = SuccessResponse<string>
