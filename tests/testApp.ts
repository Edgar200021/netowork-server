import { config } from 'dotenv'
import type { Kysely } from 'kysely'

import crypto from 'node:crypto'
import supertest from 'supertest'
import type TestAgent from 'supertest/lib/agent.js'
import { App } from '../src/app.js'
import { LoggerService } from '../src/common/services/logger.service.js'
import { readConfig } from '../src/config.js'
import type { DB } from '../src/storage/db.js'
import { setupDb } from './setupDb.js'

export class TestApp {
  constructor(
    private readonly app: App,
    readonly database: Kysely<DB>,
    private readonly superTest: TestAgent
  ) {}

  async login(body: object) {
    const response = await this.superTest
      .post(`127.0.0.1${this.app.port}/auth/login`)
      .set('Content-Type', 'application/json')
      .send(body)

    return response
  }

  async register(body: object) {
    const response = await this.superTest
      .post(`127.0.0.1${this.app.port}/auth/register`)
      .set('Content-Type', 'application/json')
      .send(body)

    return response
  }
}

export const spawnApp = async (): Promise<TestApp> => {
  config()
  const settings = await readConfig(true)
  const logger = new LoggerService(settings)

  settings.application.port = 0
  settings.database.database = crypto.randomUUID().toString()

  const db = await setupDb(settings.database)
  const app = new App(settings, logger)

  app.run()

  const test = supertest(app.server)

  return new TestApp(app, db, test)
}
