import { PortfolioJob } from '@prisma/client'
import { Request, Response } from 'express'
import { UnauthorizedError } from '../../common/error'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  GetMyPortfolioRequest,
  GetMyPortfolioResponse,
} from '../../contracts/portfolio/getMyPortfolio'
import { getMyPortfolio as gmt } from '../../services'

export const getMyPortfolio = handleWrapper(
  async (
    req: Request<{}, {}, GetMyPortfolioRequest>,
    res: Response<GetMyPortfolioResponse>
  ) => {
    if (!req.user || !req.user.isVerified || req.user.role !== 'freelancer')
      throw new UnauthorizedError('Не авторизован')

    const portfolio = await gmt(req.user.id)

    successResponse<PortfolioJob[]>(res, portfolio)
  }
)
