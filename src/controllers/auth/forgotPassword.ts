import { Request, Response } from 'express'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '../../contracts/auth/forgotPassword'
import { forgotPassword as fp } from '../../services'

export const forgotPassword = handleWrapper(
  async (
    req: Request<{}, {}, ForgotPasswordRequest>,
    res: Response<ForgotPasswordResponse>
  ) => {
    await fp(req.body)

    successResponse(
      res,
      'Письмо для восстановления пароля отправлено на вашу почту'
    )
  }
)
