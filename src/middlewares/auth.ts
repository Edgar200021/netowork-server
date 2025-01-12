import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../common/error'
import { handleWrapper } from '../common/handlerWrapper'
import { SESSION_KEY } from '../constants/cookie'
import { verifySession } from '../services'

export const auth = handleWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const id: string = req.signedCookies[SESSION_KEY]

    if (!id) throw new UnauthorizedError('Не авторизован')

    await verifySession(req, id)

    next()
  }
)
