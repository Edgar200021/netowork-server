import { User } from '@prisma/client'
import { prisma } from '../../app'
import { BadRequestError } from '../../common/error'
import { UpdateProfileRequest } from '../../contracts/users/updateProfile'

export const updateProfile = async (
  userId: User['id'],
  { aboutMe, email, firstName, lastName }: UpdateProfileRequest
) => {
  if (email && (await prisma.user.findUnique({ where: { email } })))
    throw new BadRequestError('Пользователь с таким email уже существует')

  await prisma.user.update({
    where: { id: userId },
    data: { aboutMe, email, firstName, lastName },
  })
}
