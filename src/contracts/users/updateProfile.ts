import { z } from 'zod'
import { SuccessResponse } from '../base'

export const updateProfileSchema = z.object({
  aboutMe: z.string().max(2000, 'Максимальная длина 2000 символов').optional(),
  firstName: z.string().nonempty("Поле 'Имя' не может быть пустым").optional(),
  lastName: z
    .string()
    .nonempty("Поле 'Фамилия' не может быть пустым")
    .optional(),
  email: z.string().email('Некорректный email адрес').optional(),
})

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>
export type UpdateProfileResponse = SuccessResponse<string>
