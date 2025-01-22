import { Request, Response } from 'express'
import { UnauthorizedError } from '../../common/error'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '../../contracts/users/updateProfile'
import { updateProfile as up } from '../../services/users/chanegAboutMe'

export const updateProfile = handleWrapper(
  async (
    req: Request<{}, {}, UpdateProfileRequest>,
    res: Response<UpdateProfileResponse>
  ) => {
    const user = req.user
    if (!user) throw new UnauthorizedError('Не авторизован')

    await up(user.id, req.body)

    successResponse<string>(res, 'Данные обновлены')
  }
)
