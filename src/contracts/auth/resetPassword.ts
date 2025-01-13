import { z } from 'zod'
import { SuccessResponse } from '../base'

export const resetPasswordSchema = z.object({
  token: z.string().nonempty('Некорректные данные запроса'),
  password: z
    .string()
    .nonempty("Поле 'Пароль' не может быть пустым")
    .min(8, 'Минимальная длина пароля 8 символов')
    .max(40, 'Максимальная длина пароля 40 символа'),
})

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>
export type ResetPasswordResponse = SuccessResponse<string>
