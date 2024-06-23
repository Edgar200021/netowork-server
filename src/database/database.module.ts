import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import {
  CONNECTION_POOL,
  ConfigurableDatabaseModule,
  DATABASE_OPTIONS,
} from './database.module-definition';
import { DatabaseService } from './database.service';
import { DatabaseOptions } from './interfaces/database-options.interface';

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: CONNECTION_POOL,
      inject: [DATABASE_OPTIONS],
      useFactory: (databaseOptions: DatabaseOptions) => {
        const pool = new Pool({
          host: databaseOptions.host,
          port: databaseOptions.port,
          user: databaseOptions.user,
          password: databaseOptions.password,
          database: databaseOptions.database,
        });

        pool.on('error', () => {
          process.exit(1);
        });

        return pool;
      },
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule extends ConfigurableDatabaseModule {}
