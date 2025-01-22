import { User } from '@prisma/client'
import argon2 from 'argon2'
import { prisma } from '../../app'
import { BadRequestError } from '../../common/error'
import { ChangePasswordRequest } from '../../contracts/users/changePassword'

export const changePassword = async (
  userId: User['id'],
  payload: ChangePasswordRequest
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user || !(await argon2.verify(user.hashedPassword, payload.oldPassword)))
    throw new BadRequestError('Неправильный старый пароль')

  const hashed = await argon2.hash(payload.newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { hashedPassword: hashed },
  })
}
