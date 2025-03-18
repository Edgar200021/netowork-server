import { App } from './app.js'
import { LoggerService } from './common/services/logger.service.js'
import { readConfig } from './config.js'

const settings = await readConfig(true)
settings.application.port = 0
const logger = new LoggerService(settings)

const app = new App(settings, logger)

app.run()

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    console.log('Shutting down...')
    await app.close()
    process.exit(0)
  })
}

for (const signal of ['uncaughtException', 'unhandledRejection']) {
  process.on(signal, async err => {
    logger.fatal(err)
    await app.close()
    process.exit(1)
  })
}
