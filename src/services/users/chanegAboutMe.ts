import { User } from '@prisma/client'
import { prisma } from '../../app'
import { ChangeAboutMeRequest } from '../../contracts/users/changeAboutMe'

export const changeAboutMe = async (
  userId: User['id'],
  { aboutMe }: ChangeAboutMeRequest
) => {
  await prisma.user.update({
    where: { id: userId },
    data: { aboutMe },
  })
}
