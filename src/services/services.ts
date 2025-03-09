import type { Redis } from 'ioredis'
import { Argon2Service } from '../common/services/argon2.service.js'
import type { HashingService } from '../common/services/hashing.service.js'
import type { LoggerService } from '../common/services/logger.service.js'
import type { Config } from '../config.js'
import type { Database } from '../storage/postgres/database.js'
import { AuthService } from './auth.service.js'

export class Services {
  private readonly _authService: AuthService
  private readonly _hashingService: HashingService

  constructor(
    private readonly _database: Database,
    private readonly _redis: Redis,
    private readonly _loggerService: LoggerService,
    config: Config
  ) {
    this._hashingService = new Argon2Service()

    this._authService = new AuthService(
      this._database.usersRepository,
      this._redis,
      this._loggerService,
      this._hashingService,
      config.application
    )
  }

  get authService() {
    return this._authService
  }

  get hashingService() {
    return this._hashingService
  }
}
