import crypto from 'node:crypto'

export const generateRandomToken = (size: number = 32): string => {
  return crypto.randomBytes(size).toString('hex')
}
