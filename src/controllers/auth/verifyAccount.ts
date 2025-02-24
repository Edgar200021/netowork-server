import { User } from '@prisma/client'
import { Request, Response } from 'express'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  VerifyAccountRequest,
  VerifyAccountResponse,
} from '../../contracts/auth/verifyAccount'
import { verifyAccount as verify } from '../../services'

export const verifyAccount = handleWrapper(
  async (
    req: Request<{}, {}, VerifyAccountRequest>,
    res: Response<VerifyAccountResponse>
  ) => {
    const {
      email,
      isVerified,
      role,
      firstName,
      lastName,
      avatar,
      aboutMe,
      createdAt,
    } = await verify(res, req.body)

    successResponse<Omit<User, 'hashedPassword' | 'id'>>(res, {
      email,
      isVerified,
      role,
      firstName,
      lastName,
      avatar,
      aboutMe,
      createdAt,
    })
  }
)
