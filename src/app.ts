import express from "express";
import { Redis } from "ioredis";
import multer from "multer";
import http, { type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Environment } from "./common/enums/environment.enum.js";
import type { LoggerService } from "./common/services/logger.service.js";
import type { Config } from "./config.js";
import { FILES_MAX_SIZE } from "./const/multer.js";
import { Middlewares } from "./middlewares/middlewares.js";
import { Router } from "./router/router.js";
import { Services } from "./services/services.js";
import { Database } from "./storage/postgres/database.js";
import { swaggerDocs } from "./swagger.js";

export class App {
	private readonly _server: Server;
	private readonly _port: number;
	private readonly _database: Database;
	private readonly _redis: Redis;
	private readonly _services: Services;

	constructor(
		private readonly config: Config,
		private readonly _loggerService: LoggerService,
	) {
		const database = new Database(config.database, this._loggerService);

		const redis = new Redis({
			host: config.redis.host,
			port: Number(config.redis.port),
			password: config.redis.password,
			db: Number(config.redis.database),
		});

		database.ping().catch((err) => {
			this._loggerService.fatal(`Database connection error: ${err}`);
			process.exit(1);
		});  

		redis.ping().catch((err) => {
			this._loggerService.fatal(`Redis connection error: ${err}`);
			process.exit(1);
		});

		const fileUploader = multer({
			storage: multer.memoryStorage(),
			limits: {
				fileSize: FILES_MAX_SIZE,
			},
		});

		const services = new Services(database, redis, this._loggerService, config);
		const middlewares = new Middlewares(
			database.usersRepository,
			redis,
			fileUploader,
			this._loggerService,
			config.application,
		);

		const app = express();

		if (config.application.environment === Environment.Development) {
			swaggerDocs(app, Number(config.application.port));
		}

		new Router(app, services, middlewares, config.application);

		const server = http.createServer(app);

		this._database = database;
		this._redis = redis;
		this._server = server;
		this._port = Number(config.application.port);
		this._services = services;
	}

	run() {
		this._server.listen(this._port, () => {
			this._loggerService.info(`Listening on port ${this._port}`);
		});
	}

	get port() {
		return (this._server.address() as AddressInfo).port;
	}

	get server() {
		return this._server;
	}

	get services() {
		return this._services;
	}

	get redis() {
		return this._redis;
	}

	async close() {
		await this._database.close();
		await this._redis.quit();
		this._server.close();
	}
}
