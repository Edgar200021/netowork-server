import { config } from 'dotenv'
import type { Kysely } from 'kysely'

import type { Redis } from 'ioredis'
import crypto from 'node:crypto'
import supertest from 'supertest'
import type TestAgent from 'supertest/lib/agent.js'
import { App } from '../src/app.js'
import { LoggerService } from '../src/common/services/logger.service.js'
import { readConfig } from '../src/config.js'
import type { Services } from '../src/services/services.js'
import type { DB } from '../src/storage/db.js'
import { setupDb } from './setupDb.js'

export class TestApp {
  constructor(
    private readonly app: App,
    readonly database: Kysely<DB>,
    readonly redis: Redis,
    readonly services: Services,
    private readonly superTest: TestAgent
  ) {}

  async login(body: object) {
    const response = await this.superTest
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(body)

    return response
  }

  async register(body: object) {
    const response = await this.superTest
      .post('/api/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send(body)

    return response
  }

  async verify(token: string) {
    const response = await this.superTest
      .patch('/api/v1/auth/account-verification')
      .set('Content-Type', 'application/json')
      .send({ token })

    return response
  }

  async forgotPassword(body: object) {
    const response = await this.superTest
      .post('/api/v1/auth/forgot-password')
      .set('Content-Type', 'application/json')
      .send(body)

    return response
  }

  async resetPassword(body: object) {
    const response = await this.superTest
      .patch('/api/v1/auth/reset-password')
      .set('Content-Type', 'application/json')
      .send(body)

    return response
  }

  async createAndVerify(body: object) {
    await this.register(body)
    const token = (await this.redis.keys('*'))[0]

    const response = await this.verify(token)

    return response
  }

  async close() {
    await this.database.destroy()
    this.redis.disconnect()
    await this.app.close()
  }
}

export const spawnApp = async (): Promise<TestApp> => {
  config()
  const settings = await readConfig(true)
  const logger = new LoggerService(settings)

  settings.application.port = 0
  settings.redis.database = Math.floor(Math.random() * 15) + 1
  settings.database.database = crypto.randomUUID().toString()

  const db = await setupDb(settings.database, settings.redis)
  const app = new App(settings, logger)

  await app.redis.flushdb()
  app.run()

  const test = supertest(app.server)

  return new TestApp(app, db, app.redis, app.services, test)
}
