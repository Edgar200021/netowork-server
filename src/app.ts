import express from 'express'
import http, { type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { LoggerService } from './common/services/logger.service.js'
import type { Config } from './config.js'
import { Middlewares } from './middlewares/middlewars.js'
import { Router } from './router/router.js'
import { Services } from './services/services.js'
import { Database } from './storage/postgres/database.js'

export class App {
  private static _instance: null | App = null
  //@ts-ignore
  private readonly _server: Server
  private readonly _port: number | null = null

  constructor(
    readonly config: Config,
    private readonly _loggerService: LoggerService
  ) {
    if (App._instance) return App._instance
    App._instance = this

    const database = new Database(config.database, this._loggerService)
    const services = new Services(database, this._loggerService)
    const middlewares = new Middlewares(this._loggerService)

    const app = express()

    new Router(app, services, middlewares)

    const server = http.createServer(app)

    this._server = server
    this._port = Number(config.application.port)
  }

  run() {
    this._server?.listen(this._port, () =>
      this._loggerService.info(`Listening on port ${this._port}`)
    )
  }

  get port() {
    return (this._server.address() as AddressInfo).port
  }
}
