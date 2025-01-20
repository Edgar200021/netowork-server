import { User } from '@prisma/client'
import { Request, Response } from 'express'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import { LoginRequest, LoginResponse } from '../../contracts/auth/login'
import { login as log } from '../../services'

export const login = handleWrapper(
  async (req: Request<{}, {}, LoginRequest>, res: Response<LoginResponse>) => {
    const {
      email,
      firstName,
      lastName,
      isVerified,
      role,
      avatar,
      aboutMe,
      createdAt,
    } = await log(res, req.body)

    successResponse<Omit<User, 'hashedPassword' | 'id' >>(res, {
      email,
      firstName,
      lastName,
      isVerified,
      aboutMe,
      avatar,
      role,
	  createdAt
    })
  }
)
