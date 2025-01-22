import express from 'express'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { logger } from '../app'
import {
  ChangePasswordRequest,
  changePasswordSchema,
} from '../contracts/users/changePassword'
import {
  UpdateProfileRequest,
  updateProfileSchema,
} from '../contracts/users/updateProfile'
import { changePassword, getMe, updateProfile } from '../controllers'
import { authentication } from '../middlewares/authentication'
import { validateRequest } from '../middlewares/validateRequest'

export const userRouter = express.Router()

userRouter.use(
  pinoHttp({
    logger: logger,
  }),
  authentication
)
userRouter.get(
  '/get-me',
  rateLimit({
    windowMs: 1000 * 60 * 60,
    limit: 50,
  }),
  getMe
)
userRouter.put(
  '/update-profile',
  rateLimit({
    windowMs: 1000 * 60 * 60 * 24,
    limit: 20,
  }),
  validateRequest(updateProfileSchema)<UpdateProfileRequest>,
  updateProfile
)
userRouter.put(
  '/change-password',
  rateLimit({
    windowMs: 1000 * 60 * 60 * 24,
    limit: 10,
  }),
  validateRequest(changePasswordSchema)<ChangePasswordRequest>,
  changePassword
)
