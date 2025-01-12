import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { SuccessResponse } from '../base'

export const registerRequestSchema = z.object({
  email: z
    .string()
    .nonempty("Поле 'Email' не может быть пустым")
    .email('Некорректный email адрес'),
  password: z
    .string()
    .nonempty("Поле 'Пароль' не может быть пустым")
    .min(8, 'Минимальная длина пароля 8 символов')
    .max(40, 'Максимальная длина пароля 40 символа'),
  firstName: z.string().nonempty("Поле 'Имя' не может быть пустым"),
  lastName: z.string().nonempty("Поле 'Фамилия' не может быть пустым"),
  role: z.enum([UserRole.freelancer, UserRole.client], {
    message: "Поле 'Роль' должно быть 'freelancer' или 'client'",
  }),
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type RegisterResponse = SuccessResponse<string>
