import express, { type Express } from 'express'
import { AuthHandler } from '../handlers/auth.handler.js'
import type { Middlewares } from '../middlewares/middlewars.js'
import type { Services } from '../services/services.js'

export class Router {
  constructor(app: Express, services: Services, middlewares: Middlewares) {
    app.use(
      express.json({
        limit: '10mb',
      })
    )

    new AuthHandler(app, services.authService, middlewares)

    app.use('*', (req, res) => {
      res.status(400).end('404')
    })

	app.use(middlewares.handleErrors)
  }
}
