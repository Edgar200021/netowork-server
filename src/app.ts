import { PrismaClient } from '@prisma/client'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { CronJob } from 'cron'
import express, { Request, Response } from 'express'
import Redis from 'ioredis'
import http, { Server } from 'node:http'
import path from 'node:path'
import pino from 'pino'
import { errorResponse } from './common/response/response'
import { config } from './config/config'
import { healthCheck } from './controllers/healthCheck'
import { errorHandler } from './middlewares/errorHandler'
import { authRouter, portfolioRouter, userRouter } from './routes'
import { Config } from './schemas/config'
import { deleteNotVerifiedUsers } from './services'

export const prisma = new PrismaClient()
export let redisClient: Redis
let cron: CronJob
export const logger = pino({
  level: config.application.nodeEnv === 'production' ? 'info' : 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      destination: path.join(__dirname, '../logs/app.log'),
      mkdir: true,
    },
  },
  redact: {
    paths: ['password', 'user.hashedPassword', 'user.hashedPassword'],
    remove: true,
  },
})

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

    app.get('/api/health', healthCheck)
    app.use('/api/users', userRouter)
    app.use('/api/auth', authRouter)
    app.use('/api/portfolio', portfolioRouter)

    app.use('*', (req: Request, res: Response) =>
      errorResponse(res, 404, 'Маршрут не найден')
    )
    app.use(errorHandler)

    cron = new CronJob(
      '0 0 * * *',
      deleteNotVerifiedUsers,
      null,
      false,
      'Europe/Moscow'
    )

    this._port = config.application.port
    this._host = config.application.host
    this._server = http.createServer(app)
  }

  public async run() {
    try {
      await Promise.all([
        prisma.$connect(),
        ...(redisClient.status === 'close' ? [redisClient.connect()] : []),
      ])
      cron.start()
      this._server.listen(this._port, this._host, () => {
        console.log(`Server running on http://${this._host}:${this._port}`)
      })
    } catch (error) {
      console.error(error)
      await Promise.all([prisma.$disconnect(), redisClient.disconnect()])
      process.exit(1)
    }
  }
}
