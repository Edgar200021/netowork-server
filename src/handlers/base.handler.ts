import { Router } from 'express'

export class BaseHandler {
  protected readonly _router: Router

  constructor() {
    this._router = Router()
  }
}
