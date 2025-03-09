import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import pkg from 'pg'
import type { LoggerService } from '../../common/services/logger.service.js'
import type { DatabaseConfig } from '../../config.js'
import type { DB } from '../db.js'
import { UsersRepository } from './users.repository.js'

export class Database {
  //@ts-ignore
  private readonly _db: Kysely<DB>
  //@ts-ignore
  private readonly _usersRepository: UsersRepository
  private static _instance: Database

  constructor(
    config: DatabaseConfig,
    private readonly _loggerService: LoggerService
  ) {
    if (Database._instance) return Database._instance
    Database._instance = this

    const dialect = new PostgresDialect({
      pool: new pkg.Pool({
        database: config.database,
        host: config.host,
        user: config.user,
        port: Number(config.port),
        password: config.password,
        ssl: Boolean(config.ssl),
        max: 10,
      }),
      onCreateConnection: async connection => {
        this._loggerService.info('Connected to database', connection)
      },
    })

    this._db = new Kysely<DB>({
      dialect,
	  plugins: [new CamelCasePlugin()]
    })

    this._usersRepository = new UsersRepository(this._db)
  }

  get usersRepository() {
    return this._usersRepository
  }
}
