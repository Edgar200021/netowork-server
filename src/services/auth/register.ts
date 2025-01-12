import argon2 from 'argon2'
import { prisma } from '../../app'
import { BadRequestError } from '../../common/error'
import { generateRandomToken } from '../../common/lib/generateRandomToken'
import { RegisterRequest } from '../../contracts/auth/register'
import { sendVerifyAccountEmail } from './sendVerifyAccountEmail'

export const register = async (payload: RegisterRequest) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  })

  if (user)
    throw new BadRequestError('Пользователь с таким email уже существует')

  const hashedPassword = await argon2.hash(payload.password)
  const token = generateRandomToken()

  await Promise.all([
    prisma.user.create({
      data: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        hashedPassword: hashedPassword,
        role: payload.role,
      },
    }),
    sendVerifyAccountEmail(payload.email, token),
  ])
}
