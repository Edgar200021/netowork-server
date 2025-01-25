import { prisma } from '../../app'
import { BadRequestError } from '../../common/error'
import { generateRandomToken } from '../../common/lib/generateRandomToken'
import { SetNewEmailAddressRequest } from '../../contracts/auth/setNewEmailAddress'
import { sendVerifyAccountEmail } from './sendVerifyAccountEmail'

export const setNewEmailAddress = async (
  payload: SetNewEmailAddressRequest
) => {
  const [currentUser, anotherUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: payload.oldEmail } }),
    prisma.user.findUnique({ where: { email: payload.newEmail } }),
  ])
  if (!currentUser) throw new BadRequestError('Пользователь не найден')

  if (anotherUser)
    throw new BadRequestError('Пользователь с таким email уже существует')

  const token = generateRandomToken()

  await Promise.all([
    prisma.user.update({
      data: {
        email: payload.newEmail,
      },
      where: {
        email: payload.oldEmail,
      },
    }),
    sendVerifyAccountEmail(payload.newEmail, token),
  ])
}
