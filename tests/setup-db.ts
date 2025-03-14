import { Kysely, type Migration, Migrator, PostgresDialect } from 'kysely'
import pg from 'pg'
import ts from 'ts-node'
import type { DatabaseConfig } from '../src/config.js'
import type { DB } from '../src/storage/db.js'

ts.register({
  transpileOnly: true,
})

export const setupDb = async (config: DatabaseConfig): Promise<Kysely<DB>> => {
  try {
    const pool = new pg.Pool({
      host: config.host,
      user: config.user,
      port: Number(config.port),
      password: config.password,
      ssl: Boolean(config.ssl),
      max: 10,
    })

    await pool.query(`CREATE DATABASE "${config.database}";`)

    const db = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool,
      }),
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
      process.exit(1)
    }

    return db
  } catch (error) {
    console.error('Failed to setup database for testing', error)
    process.exit(1)
  }
}
