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
  VerifyAccountRequest,
  verifyAccountRequestSchema,
} from '../contracts/auth/verifyAccount'
import { login, register, verifyAccount } from '../controllers'
import { sendVerificationEmail } from '../controllers/auth/sendVerificationEmail'
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
