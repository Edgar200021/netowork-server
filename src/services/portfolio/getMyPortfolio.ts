import { PortfolioJob, User } from '@prisma/client'
import { prisma } from '../../app'

export const getMyPortfolio = async (
  userId: User['id']
): Promise<PortfolioJob[]> => {
  const portfolio = await prisma.portfolioJob.findMany({
    where: {
      userId,
    },
  })

  return portfolio
}
