import express from 'express'
import { LoginRequest, loginSchema } from '../contracts/auth/login'
import {
  RegisterRequest,
  registerRequestSchema,
} from '../contracts/auth/register'
import {
  SendVerificationEmailRequest,
  sendVerificationEmailSchema,
} from '../contracts/auth/sendVerificationEmail'
import {
  SetNewEmailAddressRequest,
  setNewEmailAddressRequestSchema,
} from '../contracts/auth/setNewEmailAddress'
import {
  VerifyAccountRequest,
  verifyAccountRequestSchema,
} from '../contracts/auth/verifyAccount'
import {
  login,
  register,
  sendVerificationEmail,
  setNewEmailAddress,
  verifyAccount,
} from '../controllers'
import { validateRequest } from '../middlewares/validateRequest'

export const authRouter = express.Router()

authRouter.post(
  '/register',
  validateRequest(registerRequestSchema)<RegisterRequest>,
  register
)
authRouter.post('/login', validateRequest(loginSchema)<LoginRequest>, login)
authRouter.post(
  '/send-verification-email',
  validateRequest(sendVerificationEmailSchema)<SendVerificationEmailRequest>,
  sendVerificationEmail
)
authRouter.patch(
  '/verify',
  validateRequest(verifyAccountRequestSchema)<VerifyAccountRequest>,
  verifyAccount
)
authRouter.patch(
  '/set-new-email-address',
  validateRequest(setNewEmailAddressRequestSchema)<SetNewEmailAddressRequest>,
  setNewEmailAddress
)
1