import { Request, Response } from 'express'
import { UnauthorizedError } from '../../common/error'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  ChangeAboutMeRequest,
  ChangeAboutMeResponse,
} from '../../contracts/users/changeAboutMe'
import { changeAboutMe as ca } from '../../services/users/chanegAboutMe'

export const changeAboutMe = handleWrapper(
  async (
    req: Request<{}, {}, ChangeAboutMeRequest>,
    res: Response<ChangeAboutMeResponse>
  ) => {
    const user = req.user
    if (!user) throw new UnauthorizedError('Не авторизован')

    await ca(user.id, req.body)

    successResponse<string>(res, 'Данные обновлены')
  }
)
