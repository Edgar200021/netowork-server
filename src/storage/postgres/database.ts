import { CamelCasePlugin, Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import type { LoggerService } from "../../common/services/logger.service.js";
import type { DatabaseConfig } from "../../config.js";
import type { DB } from "../db.js";

export class Database extends Kysely<DB> {
	constructor(
		config: DatabaseConfig,
		private readonly _loggerService: LoggerService,
	) {
		const dialect = new PostgresDialect({
			pool: new pg.Pool({
				database: config.database,
				host: config.host,
				user: config.user,
				port: Number(config.port),
				password: config.password,
				ssl: Boolean(config.ssl),
				max: 10,
			}),
		});

		super({
			dialect,
			plugins: [new CamelCasePlugin()],
		});
	}

	async close() {
		this._loggerService.info("Closing database connection...");
		await this.destroy();
	}

	async ping() {
		this._loggerService.info("Pinging database...");
		await sql`SELECT 1`.execute(this);
	}
}
