import express from 'express'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { logger } from '../app'
import {
  ChangeAboutMeRequest,
  changeAboutMeSchema,
} from '../contracts/users/changeAboutMe'
import { changeAboutMe, getMe } from '../controllers'
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
  '/change-about-me',
  rateLimit({
    windowMs: 1000 * 60 * 60 * 24,
    limit: 20,
  }),
  validateRequest(changeAboutMeSchema)<ChangeAboutMeRequest>,
  changeAboutMe
)
