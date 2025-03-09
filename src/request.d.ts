import * as express from 'express'
import type { User } from './storage/postgres/types/user.types.ts'

declare global {
	namespace Express {
		interface Request {
			user?: User
		}
	}
}