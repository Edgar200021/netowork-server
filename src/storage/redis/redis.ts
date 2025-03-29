import { Redis as rd } from "ioredis";
import type { RedisConfig } from "../../config.js";

export class Redis extends rd {
	constructor(readonly config: RedisConfig) {
		super({
			host: config.host,
			port: Number(config.port),
			password: config.password,
			db: Number(config.database),
		});
	}
}
