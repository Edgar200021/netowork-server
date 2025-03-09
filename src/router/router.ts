import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type Express } from 'express'
import type { ApplicationConfig } from '../config.js'
import { AuthHandler } from '../handlers/auth.handler.js'
import type { Middlewares } from '../middlewares/middlewares.js'
import type { Services } from '../services/services.js'

export class Router {
  constructor(
    app: Express,
    services: Services,
    middlewares: Middlewares,
    config: ApplicationConfig
  ) {
    app.use(
      express.json({
        limit: '10mb',
      })
    )
    app.use(cookieParser(config.cookieSecret))
    app.use(
      cors({
        credentials: true,
      })
    )

    new AuthHandler(app, services.authService, middlewares)

    app.use('*', (req, res) => {
      res.status(400).end('404')
    })

    app.use(middlewares.handleErrors)
  }
}
