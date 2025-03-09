import { Argon2Service } from '../common/services/argon2.service.js'
import { HashingService } from '../common/services/hashing.service.js'
import type { LoggerService } from '../common/services/logger.service.js'
import type { Database } from '../storage/postgres/database.js'
import { AuthService } from './auth.service.js'

export class Services {
  private static _instance: null | Services = null
  //@ts-ignore
  private readonly _authService: AuthService
  //@ts-ignore
  private readonly _hashingService: HashingService

  constructor(
    private readonly _database: Database,
    private readonly _loggerService: LoggerService
  ) {
    if (Services._instance) return Services._instance
    Services._instance = this

    this._hashingService = new Argon2Service()

    this._authService = new AuthService(
      this._database.usersRepository,
      this._loggerService,
      this._hashingService
    )
  }

  get authService() {
    return this._authService
  }
}
