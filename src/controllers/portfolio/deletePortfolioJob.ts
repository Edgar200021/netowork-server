import { Request, Response } from 'express'
import { BadRequestError, UnauthorizedError } from '../../common/error'
import { handleWrapper } from '../../common/handlerWrapper'
import { successResponse } from '../../common/response/response'
import {
  DeletePortfolioJobRequest,
  DeletePortfolioJobResponse,
} from '../../contracts/portfolio/deletePortfolioJob'
import { deletePortfolioJob as dpj } from '../../services'

export const deletePortfolioJob = handleWrapper(
  async (
    req: Request<{ id: string }, {}, DeletePortfolioJobRequest>,
    res: Response<DeletePortfolioJobResponse>
  ) => {
    const user = req.user

    if (!user) throw new UnauthorizedError('Не авторизован')
    if (!req.params.id) throw new BadRequestError('ID работы не указан')

    await dpj(user.id, req.params.id)

    successResponse<null>(res, null, 204)
  }
)
