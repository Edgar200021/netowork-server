import { UserRole } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorizedError } from '../common/error'
import { handleWrapper } from '../common/handlerWrapper'

export const authorization = (roles: UserRole[]) =>
  handleWrapper(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) throw new UnauthorizedError('Не авторизован')

    if (!roles.includes(user.role))
      throw new ForbiddenError('Недостаточно прав')

    next()
  })
