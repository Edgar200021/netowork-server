import { Request, Response } from 'express'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../../contracts/auth/resetPassword'
import { resetPassword as rp } from '../../services'

export const resetPassword = handleWrapper(
  async (
    req: Request<{}, {}, ResetPasswordRequest>,
    res: Response<ResetPasswordResponse>
  ) => {
    await rp(req.body)

    successResponse(res, 'Пароль успешно изменен')
  }
)
