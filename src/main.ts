import { config } from 'dotenv'
import { App } from './app.js'
import { LoggerService } from './common/services/logger.service.js'
import { readConfig } from './config.js'
;(async () => {
  try {
    config()
    const settings = await readConfig()
    const logger = new LoggerService(settings)

    const app = new App(settings, logger)

    app.run()
  } catch (err) {
    console.log(err)
  }
})()
