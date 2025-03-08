import type { Express, Request, Response } from 'express'
import { Router as ExpressRouter } from 'express'

export abstract class Router {
  protected readonly _app: ExpressRouter

  constructor() {
    this._app = ExpressRouter()
  }

  setRoute(
    method: keyof Pick<Express, 'get' | 'post' | 'put' | 'patch' | 'delete'>,
    path: string,
    handler: (req: Request, res: Response) => void
  ) {
    this._app[method](path, handler)
  }

  get router() {
    return this._app
  }
}
