import { PortfolioJob, User } from '@prisma/client'
import { prisma } from '../../app'
import { NotFoundError } from '../../common/error'

export const deletePortfolioJob = async (
  userId: User['id'],
  portfolioJobId: PortfolioJob['id']
) => {
  if (
    !(await prisma.portfolioJob.findUnique({
      where: {
        userId,
        id: portfolioJobId,
      },
    }))
  )
    throw new NotFoundError('Работа не найдена')

  await prisma.portfolioJob.delete({
    where: {
      id: portfolioJobId,
      userId,
    },
  })
}
