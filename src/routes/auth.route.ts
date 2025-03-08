import { Router } from '../common/router.js'

export class AuthRouter extends Router {
  constructor() {
    super()

    this.setRoute('get', '/', (req, res) => {
      res.end('HELLO ')
    })
  }
}
