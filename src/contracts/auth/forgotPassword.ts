import { z } from 'zod'
import { SuccessResponse } from '../base'

export const forgotPasswordSchema = z.object({
  email: z.string().email('Некорректный email адрес'),
})

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>
export type ForgotPasswordResponse = SuccessResponse<string>
