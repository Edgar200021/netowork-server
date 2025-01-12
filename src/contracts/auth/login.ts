import { User } from '@prisma/client'
import { z } from 'zod'
import { SuccessResponse } from '../base'

export const loginSchema = z.object({
  email: z.string().email('Некорректный email адрес'),
  password: z.string().nonempty(),
})

export type LoginRequest = z.infer<typeof loginSchema>
export type LoginResponse = SuccessResponse<Omit<User, 'hashedPassword' | 'id'>>
