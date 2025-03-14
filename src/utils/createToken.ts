import crypto from 'node:crypto'

export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex')
}
