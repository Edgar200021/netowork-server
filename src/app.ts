import express from 'express'
import http, { type Server } from 'node:http'
import type { LoggerService } from './common/services/logger.service.js'
import type { Config } from './config.js'
import { Router } from './routes/index.js'

export class App {
  private static _instance: null | App = null
  private readonly _server: Server | null = null
  private readonly _port: number | null = null

  constructor(
    readonly config: Config,
    private readonly _loggerService: LoggerService
  ) {
    if (App._instance) return App._instance
    App._instance = this

    const app = express()
    const server = http.createServer(app)

    server.address = () => ({
      address: config.application.host,
      port: Number(config.application.port),
      family: 'IPv4',
    })

    new Router(app)

    this._server = server
    this._port = Number(config.application.port)
  }

  run() {
    this._server?.listen(() =>
      this._loggerService.info(`Listening on port ${this._port}`)
    )
  }
}
