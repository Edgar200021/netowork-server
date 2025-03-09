import express from 'express'
import { Redis } from 'ioredis'
import http, { type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { LoggerService } from './common/services/logger.service.js'
import type { Config } from './config.js'
import { Middlewares } from './middlewares/middlewares.js'
import { Router } from './router/router.js'
import { Services } from './services/services.js'
import { Database } from './storage/postgres/database.js'

export class App {
  private readonly _server: Server
  private readonly _port: number
  private readonly _database: Database
  private readonly _redis: Redis

  constructor(
    readonly config: Config,
    private readonly _loggerService: LoggerService
  ) {
    const database = new Database(config.database, this._loggerService)

    const redis = new Redis({
      host: config.redis.host,
      port: Number(config.redis.port),
      password: config.redis.password,
      db: Number(config.redis.database),
    })

    database.ping().catch(err => {
      this._loggerService.error(`Database connection error: ${err}`)
      process.exit(1)
    })

    redis.ping().catch(err => {
      this._loggerService.error(`Redis connection error: ${err}`)
      process.exit(1)
    })

    const services = new Services(database, redis, this._loggerService, config)
    const middlewares = new Middlewares(
      database.usersRepository,
      redis,
      this._loggerService,
      config.application
    )

    const app = express()

    new Router(app, services, middlewares, config.application)

    const server = http.createServer(app)

    this._database = database
    this._redis = redis
    this._server = server
    this._port = Number(config.application.port)
  }

  run() {
    for (const signal of ['SIGTERM', 'SIGINT']) {
      process.on(signal, async () => {
        console.log('Shutting down...')

        await this._database.close()
        this._redis.disconnect()
        this._server.close()
      })
    }

    console.log(this._port)

    this._server.listen(this._port, () =>
      this._loggerService.info(`Listening on port ${this._port}`)
    )
  }

  get port() {
    return (this._server.address() as AddressInfo).port
  }
}
