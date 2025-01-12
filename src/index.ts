import { Application } from './app'
import { config } from './config/config'
;(async () => {
  const app = new Application(config)

  app.run()
})()
