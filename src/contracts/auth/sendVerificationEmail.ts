import { z } from 'zod'
import { SuccessResponse } from '../base'

export const sendVerificationEmailSchema = z.object({
  email: z.string().email('Некорректный email адрес'),
})

export type SendVerificationEmailRequest = z.infer<
  typeof sendVerificationEmailSchema
>
export type SendVerificationEmailResponse = SuccessResponse<string>
