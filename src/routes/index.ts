import type { Express } from 'express'
import { AuthRouter } from './auth.route.js'

export class Router {
  private readonly _authRouter: AuthRouter

  constructor(app: Express) {
    this._authRouter = new AuthRouter()

    app.use('/auth', this._authRouter.router)
  }
}
