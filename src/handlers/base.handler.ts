import { Router } from 'express'

export abstract class BaseHandler {
  protected readonly _router: Router

  protected abstract bindMethods(): void
  protected abstract setupRoutes(): void

  constructor() {
    this._router = Router()
  }
}
