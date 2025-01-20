import { z } from 'zod'
import { SuccessResponse } from '../base'

export const changeAboutMeSchema = z.object({
  aboutMe: z
    .string()
    .nonempty("Поле 'О себе' не может быть пустым")
    .max(2000, 'Максимальная длина 2000 символов'),
})

export type ChangeAboutMeRequest = z.infer<typeof changeAboutMeSchema>
export type ChangeAboutMeResponse = SuccessResponse<string>
