import {
  ACCOUNT_VERIFICATION_PREFIX,
  LOGIN_SESSION_PREFIX,
} from '../../constants/redis'
import { RESET_PASSWORD_PREFIX } from './../../constants/redis'

export const generateRedisAccountVerificationKey = (token: string) => {
  return `${ACCOUNT_VERIFICATION_PREFIX}${token}`
}

export const generateRedisLoginSessionKey = (token: string) => {
  return `${LOGIN_SESSION_PREFIX}${token}`
}

export const generateRedisResetPasswordKey = (token: string) => {
  return `${RESET_PASSWORD_PREFIX}${token}`
}
