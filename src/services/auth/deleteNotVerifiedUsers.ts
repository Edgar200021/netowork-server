import { prisma } from '../../app'

export const deleteNotVerifiedUsers = async () => {
  try {
    await prisma.user.deleteMany({
      where: {
        isVerified: false,
        createdAt: {
          gt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      },
    })
  } catch (error) {
    console.warn(error)
  }
}
