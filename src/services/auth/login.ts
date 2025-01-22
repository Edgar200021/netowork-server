import { User } from '@prisma/client'
import argon2 from 'argon2'
import { CookieOptions, Response } from 'express'
import { prisma } from '../../app'
import { BadRequestError } from '../../common/error'
import { config } from '../../config/config'
import { SESSION_KEY } from '../../constants/cookie'
import { LoginRequest } from '../../contracts/auth/login'
import { generateSession } from './generateSession'

export const login = async (
  res: Response,
  payload: LoginRequest
): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { email: payload.email } })

  if (!user || !(await argon2.verify(user.hashedPassword, payload.password)))
    throw new BadRequestError('Неправильные email или пароль')
  if (!user.isVerified)
    throw new BadRequestError('Пользователь не верифицирован')

  const uuid = await generateSession(user.id)

  res.cookie(SESSION_KEY, uuid, cookieOptions())

  return user
}

export const cookieOptions = (): CookieOptions => {
  return {
    httpOnly: true,
    secure: config.application.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    signed: true,
  }
}
