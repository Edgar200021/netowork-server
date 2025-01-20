import { Request, Response } from 'express'
import { UnauthorizedError } from '../../common/error'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import { SESSION_KEY } from '../../constants/cookie'
import { cookieOptions, logout as lg } from '../../services'

export const logout = handleWrapper(
  async (req: Request, res: Response<string>) => {
    const sessionId: string = req.signedCookies[SESSION_KEY]

    if (!sessionId) throw new UnauthorizedError('Не авторизован')

    await lg(sessionId)

    res.clearCookie(SESSION_KEY, cookieOptions())

    return successResponse<string>(res, 'Вы успешно вышли из аккаунта')
  }
)