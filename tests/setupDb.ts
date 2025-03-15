import { Redis } from 'ioredis'
import {
  CamelCasePlugin,
  Kysely,
  type Migration,
  Migrator,
  PostgresDialect,
} from 'kysely'
import { exec } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import pg from 'pg'
import ts from 'ts-node'
import type { DatabaseConfig, RedisConfig } from '../src/config.js'
import type { DB } from '../src/storage/db.js'
const asyncExec = promisify(exec)

ts.register({
  transpileOnly: true,
})

export const setupDb = async (
  postgresConfig: DatabaseConfig,
  redisConfig: RedisConfig
): Promise<Kysely<DB>> => {
  try {
    const pool = new pg.Pool({
      host: postgresConfig.host,
      user: postgresConfig.user,
      port: Number(postgresConfig.port),
      password: postgresConfig.password,
      ssl: Boolean(postgresConfig.ssl),
      max: 10,
    })

    await asyncExec(
      path.join(import.meta.dirname, '../scripts/deleteTestDatabases.sh')
    ).catch(console.error)

    await pool.query(`CREATE DATABASE "${postgresConfig.database}";`)
      await pool.end()

    const mainPool = new pg.Pool({
      host: postgresConfig.host,
      user: postgresConfig.user,
      port: Number(postgresConfig.port),
      password: postgresConfig.password,
      ssl: Boolean(postgresConfig.ssl),
      database: postgresConfig.database,
      max: 10,
    })

    const db = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: mainPool,
      }),
      plugins: [new CamelCasePlugin()],
    })

    const migrator = new Migrator({
      db,
      provider: {
        getMigrations() {
          const migrations: Record<string, Migration> = import.meta.glob(
            '../migrations/**.ts',
            {
              eager: true,
            }
          )

          return Promise.resolve(migrations)
        },
      },
    })

    const { error } = await migrator.migrateToLatest()

    if (error) {
      console.error('Failed to run migrations', error)
      throw new Error('Migration failed')
    }

    return db
  } catch (error) {
    console.error('Failed to setup database for testing', error)
    process.exit(1)
  }
}
