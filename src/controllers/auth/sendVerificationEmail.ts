import { Request, Response } from 'express'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  SendVerificationEmailRequest,
  SendVerificationEmailResponse,
} from '../../contracts/auth/sendVerificationEmail'
import { sendVerifyAccountEmail } from '../../services'

export const sendVerificationEmail = handleWrapper(
  async (
    req: Request<{}, {}, SendVerificationEmailRequest>,
    res: Response<SendVerificationEmailResponse>
  ) => {
    await sendVerifyAccountEmail(req.body.email, undefined, true)

    successResponse<string>(
      res,
      'Письмо для подтверждения аккаунта отправлено на вашу почту'
    )
  }
)
