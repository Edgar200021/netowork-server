import { Request, Response } from 'express'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  SetNewEmailAddressRequest,
  SetNewEmailAddressResponse,
} from '../../contracts/auth/setNewEmailAddress'
import { setNewEmailAddress as setNewAddress } from '../../services'

export const setNewEmailAddress = handleWrapper(
  async (
    req: Request<{}, {}, SetNewEmailAddressRequest>,
    res: Response<SetNewEmailAddressResponse>
  ) => {
    await setNewAddress(req.body)

    successResponse<string>(
      res,
      'Письмо для подтверждения аккаунта отправлено на новый email адрес'
    )
  }
)
