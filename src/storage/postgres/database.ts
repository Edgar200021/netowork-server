import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { LoggerService } from "../../common/services/logger.service.js";
import type { DatabaseConfig } from "../../config.js";
import type { DB } from "../db.js";
import { UsersRepository } from "./users.repository.js";
import { WorksRepository } from "./works.repository.js";

export class Database {
	private readonly _db: Kysely<DB>;
	private readonly _usersRepository: UsersRepository;
	private readonly _worksRepository: WorksRepository;

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

		this._db = new Kysely<DB>({
			dialect,
			plugins: [new CamelCasePlugin()],
		});

		this._usersRepository = new UsersRepository(this._db);
		this._worksRepository = new WorksRepository(this._db);
	}

	get usersRepository() {
		return this._usersRepository;
	}

	async close() {
		await this._db.destroy();
	}

	async ping() {
		await this._db.selectFrom("users").selectAll().execute();
	}
}
