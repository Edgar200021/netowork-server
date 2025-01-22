import { Request, Response } from 'express'
import { UnauthorizedError } from '../../common/error'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '../../contracts/users/changePassword'
import { changePassword as cp } from '../../services'

export const changePassword = handleWrapper(
  async (
    req: Request<{}, {}, ChangePasswordRequest>,
    res: Response<ChangePasswordResponse>
  ) => {
    const user = req.user
    if (!user) throw new UnauthorizedError('Не авторизован')

    await cp(user.id, req.body)

    successResponse(res, 'Пароль успешно изменен')
  }
)
