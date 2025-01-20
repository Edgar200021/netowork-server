import { User } from '@prisma/client'
import { SuccessResponse } from '../base'

export type GetMeRequest = null
export type GetMeResponse = SuccessResponse<Omit<User, 'hashedPassword' | 'id'>>
