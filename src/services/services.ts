import type { Redis } from 'ioredis'
import { Argon2Service } from '../common/services/argon2.service.js'
import { EmailService } from '../common/services/email.service.js'
import type { HashingService } from '../common/services/hashing.service.js'
import type { LoggerService } from '../common/services/logger.service.js'
import type { Config } from '../config.js'
import type { Database } from '../storage/postgres/database.js'
import { AuthService } from './auth.service.js'

export class Services {
  private readonly _authService: AuthService
  private readonly _hashingService: HashingService
  private readonly _emailService: EmailService

  constructor(
    private readonly _database: Database,
    private readonly _redis: Redis,
    logger: LoggerService,
    config: Config
  ) {
    this._hashingService = new Argon2Service()
    this._emailService = new EmailService(
      config.application,
      config.email,
      logger
    )

    this._authService = new AuthService(
      config.application,
      this._database.usersRepository,
      this._redis,
      logger,
      this._hashingService,
      this._emailService
    )
  }

  get authService() {
    return this._authService
  }

  get hashingService() {
    return this._hashingService
  }
}
