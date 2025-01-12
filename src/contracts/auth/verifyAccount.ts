import { z } from 'zod'
import { SuccessResponse } from '../base'
import { User } from '@prisma/client'

export const verifyAccountRequestSchema = z.object({
  token: z.string().nonempty('Некорректные данные запроса'),
})

export type VerifyAccountRequest = z.infer<typeof verifyAccountRequestSchema>
export type VerifyAccountResponse = SuccessResponse<
  Omit<User, 'hashedPassword' | 'id'>
>
