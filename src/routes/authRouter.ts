import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  ForgotPasswordRequest,
  forgotPasswordSchema,
} from '../contracts/auth/forgotPassword'
import { LoginRequest, loginSchema } from '../contracts/auth/login'
import {
  RegisterRequest,
  registerRequestSchema,
} from '../contracts/auth/register'
import {
  ResetPasswordRequest,
  resetPasswordSchema,
} from '../contracts/auth/resetPassword'
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
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  sendVerificationEmail,
  setNewEmailAddress,
  verifyAccount,
} from '../controllers'
import { auth } from '../middlewares/auth'
import { validateRequest } from '../middlewares/validateRequest'

export const authRouter = express.Router()

authRouter.post(
  '/register',
  rateLimit({
    windowMs: 1000 * 60 * 60,
    limit: 5,
  }),
  validateRequest(registerRequestSchema)<RegisterRequest>,
  register
)
authRouter.post(
  '/login',
  rateLimit({
    windowMs: 1000 * 60 * 60,
    limit: 50,
    skipSuccessfulRequests: true,
  }),
  validateRequest(loginSchema)<LoginRequest>,
  login
)
authRouter.post(
  '/send-verification-email',
  rateLimit({
    windowMs: 1000 * 60 * 60 * 24,
    limit: 10,
  }),
  validateRequest(sendVerificationEmailSchema)<SendVerificationEmailRequest>,
  sendVerificationEmail
)
authRouter.patch(
  '/verify',
  rateLimit({
    windowMs: 1000 * 60 * 60 * 24,
    limit: 10,
  }),
  validateRequest(verifyAccountRequestSchema)<VerifyAccountRequest>,
  verifyAccount
)
authRouter.patch(
  '/set-new-email-address',
  rateLimit({
    windowMs: 1000 * 60 * 60,
    limit: 4,
  }),
  validateRequest(setNewEmailAddressRequestSchema)<SetNewEmailAddressRequest>,
  setNewEmailAddress
)
authRouter.post(
  '/forgot-password',
  rateLimit({
    windowMs: 1000 * 60 * 60 * 24,
    limit: 10,
  }),
  validateRequest(forgotPasswordSchema)<ForgotPasswordRequest>,
  forgotPassword
)
authRouter.patch(
  '/reset-password',
  rateLimit({
    windowMs: 1000 * 60 * 60 * 24,
    limit: 10,
  }),
  validateRequest(resetPasswordSchema)<ResetPasswordRequest>,
  resetPassword
)

authRouter.post('/logout', auth, logout)
