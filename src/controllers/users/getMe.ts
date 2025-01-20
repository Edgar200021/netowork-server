import { User } from '@prisma/client'
import { Request, Response } from 'express'
import { UnauthorizedError } from '../../common/error'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import { GetMeRequest, GetMeResponse } from '../../contracts/users/getMe'

export const getMe = handleWrapper(
  async (req: Request<{}, {}, GetMeRequest>, res: Response<GetMeResponse>) => {
    const user = req.user

    if (!user) throw new UnauthorizedError('Не авторизован')


    successResponse<Omit<User, 'hashedPassword' | 'id'>>(res, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      aboutMe: user.aboutMe,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    })
  }
)
