import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../drizzle/schema';
import { Config, DatabaseConfig } from './configuration';

export const databaseConfig = (
  config: ConfigService<Config, true>,
): NodePgDatabase<typeof schema> => {
  const db = config.getOrThrow<DatabaseConfig>('database');

  const pool = new Pool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    ssl: db.ssl,
  });

  return drizzle(pool, {
    schema: {
      ...schema,
    },
  }) as NodePgDatabase<typeof schema>;
};
