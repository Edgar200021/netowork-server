import express from 'express'
import { pinoHttp } from 'pino-http'
import { logger } from '../app'
import { deletePortfolioJob, getMyPortfolio } from '../controllers'
import { authentication } from '../middlewares/authentication'
import { authorization } from '../middlewares/authorization'
export const portfolioRouter = express.Router()

portfolioRouter.use(
  pinoHttp({
    logger: logger,
  }),
  authentication,
  authorization(['freelancer', 'admin'])
)

portfolioRouter.get('/my-portfolio', getMyPortfolio)
portfolioRouter.delete('/:id', deletePortfolioJob)
