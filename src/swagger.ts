import type { Express, Request, Response } from 'express'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Netowork API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        Session: {
          type: 'apiKey',
          name: 'Session',
          in: 'cookie',
        },
      },
    },
  },

  apis: ['src/**/*.handler.ts', 'src/**/*.dto.ts'],
}

const swaggerSpec = swaggerJSDoc(options)

export const swaggerDocs = (app: Express, port: number) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get('/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  console.log(`Docs available at http://localhost:${port}/docs`)
}
