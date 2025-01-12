import { Request, Response } from 'express'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  RegisterRequest,
  RegisterResponse,
} from '../../contracts/auth/register'
import { register as reg } from '../../services'

export const register = handleWrapper(
  async (
    req: Request<{}, {}, RegisterRequest>,
    res: Response<RegisterResponse>
  ) => {
    await reg(req.body)

    successResponse<string>(
      res,
      'Регистрация аккаунта прошла успешно, проверьте почту для подтверждения аккаунта',
      201
    )
  }
)
