import { PortfolioJob } from '@prisma/client'
import { SuccessResponse } from '../base'

export type GetMyPortfolioRequest = null
export type GetMyPortfolioResponse = SuccessResponse<PortfolioJob[]>
