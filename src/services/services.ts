import type { Redis } from "ioredis";
import { Argon2Service } from "../common/services/argon2.service.js";
import type { HashingService } from "../common/services/hashing.service.js";
import type { LoggerService } from "../common/services/logger.service.js";
import type { Config } from "../config.js";
import type { Database } from "../storage/postgres/database.js";
import { AuthService } from "./auth.service.js";
import { EmailService } from "./email.service.js";
import { ImageUploader } from "./imageUploader.service.js";
import { UsersService } from "./users.service.js";

export class Services {
	private readonly _authService: AuthService;
	private readonly _usersService: UsersService;
	private readonly _hashingService: HashingService;
	private readonly _emailService: EmailService;
	private readonly _imageUploader: ImageUploader;

	constructor(
		private readonly _database: Database,
		private readonly _redis: Redis,
		private readonly _logger: LoggerService,
		config: Config,
	) {
		this._hashingService = new Argon2Service();
		this._emailService = new EmailService(config.application, config.email);
		this._imageUploader = new ImageUploader(config.cloudinary);

		this._authService = new AuthService(
			config.application,
			this._database.usersRepository,
			this._redis,
			this._hashingService,
			this._emailService,
		);

		this._usersService = new UsersService(
			this._database.usersRepository,
			this._hashingService,
			this._authService,
			this._emailService,
			this._redis,
			this._imageUploader,
			config.application,
		);
	}

	get authService() {
		return this._authService;
	}

	get usersService() {
		return this._usersService;
	}

	get hashingService() {
		return this._hashingService;
	}

	get logger() {
		return this._logger;
	}

	get emailService() {
		return this._emailService;
	}
}
