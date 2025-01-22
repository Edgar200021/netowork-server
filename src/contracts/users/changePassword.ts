import { z } from 'zod'
import { SuccessResponse } from '../base'

export const changePasswordSchema = z.object({
  oldPassword: z.string().nonempty("Поле 'Старый пароль' не может быть пустым"),
  newPassword: z
    .string()
    .nonempty("Поле 'Новый пароль' не может быть пустым")
    .min(8, 'Минимальная длина пароля 8 символов')
    .max(40, 'Максимальная длина пароля 40 символа'),
})
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>
export type ChangePasswordResponse = SuccessResponse<string>
