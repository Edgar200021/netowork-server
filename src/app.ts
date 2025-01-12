import { PrismaClient } from '@prisma/client'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Request, Response } from 'express'
import Redis from 'ioredis'
import http, { Server } from 'node:http'
import { errorResponse } from './common/response/response'
import { errorHandler } from './middlewares/errorHandler'
import { authRouter, userRouter } from './routes'
import { Config } from './schemas/config'

export const prisma = new PrismaClient()
export let redisClient: Redis

export class Application {
  private _port: number
  private _host: string
  private _server: Server

  constructor(config: Config) {
    const app = express()

    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      username: config.redis.username,
      password: config.redis.password,
      db: config.redis.database,
    })

    redisClient.ping(err => {
      if (err) {
        console.error('Redis connection failed:', err)
        process.exit(1)
      }
      console.log('Redis connection successful')
    })

    app.use(express.json())
    app.use(
      cors({
        credentials: true,
        origin: true,
        methods: ['POST', 'GET', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
      })
    )
    app.use(cookieParser(config.application.cookieSecret))

    app.use('/api/users', userRouter)
    app.use('/api/auth', authRouter)

    app.use('*', (req: Request, res: Response) =>
      errorResponse(res, 404, 'Маршрут не найден')
    )
    app.use(errorHandler)

    this._port = config.application.port
    this._host = config.application.host
    this._server = http.createServer(app)
  }

  public async run() {
    try {
      await prisma.$connect()
      this._server.listen(this._port, this._host, () => {
        console.log(`Server running on http://${this._host}:${this._port}`)
      })
    } catch (error) {
      console.error(error)
      prisma.$disconnect()
      process.exit(1)
    }
  }
}
