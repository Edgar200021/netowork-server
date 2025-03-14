import { config } from 'dotenv'
import { Kysely, PostgresDialect } from 'kysely'
import crypto from 'node:crypto'
import pg from 'pg'
import supertest from 'supertest'
import type TestAgent from 'supertest/lib/agent.js'
import { App } from '../src/app.js'
import { LoggerService } from '../src/common/services/logger.service.js'
import { type DatabaseConfig, readConfig } from '../src/config.js'
import type { DB } from '../src/storage/db.js'

export class TestApp {
  constructor(
    private readonly app: App,
    private readonly database: Kysely<DB>,
    private readonly superTest: TestAgent
  ) {}

  async login(body: object) {
    const request = await this.superTest
      .post(`127.0.0.1${this.app.port}/auth/login`)
      .set('Content-Type', 'application/json')
      .send(body)

    return request
  }

  async register(body: object) {
    const request = await this.superTest
      .post(`127.0.0.1${this.app.port}/auth/register`)
      .set('Content-Type', 'application/json')
      .send(body)

    return request
  }
}

const setupDb = async (config: DatabaseConfig): Promise<Kysely<DB>> => {
  try {
    const pool = new pg.Pool({
      host: config.host,
      user: config.user,
      port: Number(config.port),
      password: config.password,
      ssl: Boolean(config.ssl),
      max: 10,
    })

    await pool.query(`CREATE DATABASE ${config.database}`)

    const db = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool,
      }),
    })

    return db
  } catch (error) {
    console.error('Failed to setup database for testing', error)
    process.exit(1)
  }
}

export const spawnApp = async (): Promise<TestApp> => {
  config()
  const settings = await readConfig()
  const logger = new LoggerService(settings)

  settings.database.database = crypto.randomUUID()

  const db = await setupDb(settings.database)
  const app = new App(settings, logger)

  const test = supertest(app.server)

  return new TestApp(app, db, test)
}
