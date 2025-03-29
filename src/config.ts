import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import yaml from "js-yaml";
import { existsSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { constants } from "node:fs/promises";
import path from "node:path";
import { Environment } from "./services/common/enums/environment.enum.js";
import { LogLevel } from "./services/common/enums/logLevel.enum.js";

const applicationConfigSchema = vine.object({
	port: vine.number({ strict: true }).range([0, 65535]),
	host: vine.string().ipAddress(),
	environment: vine.enum(Environment),
	cookieSecret: vine.string().minLength(32),
	clientUrl: vine.string(),
	accountVerificationPath: vine.string(),
	resetPasswordPath: vine.string(),
	sessionTtlInMinutes: vine.number({ strict: true }).range([60, 43800]),
	accountVerificationTtlInMinutes: vine
		.number({ strict: true })
		.range([60, 1440]),
	resetPasswordTtlInMinutes: vine.number({ strict: true }).range([10, 15]),
	registeredEmailTtlInMinutes: vine.number({ strict: true }).range([60, 1440]),
});

const loggerConfigSchema = vine.object({
	logLevel: vine.enum(LogLevel),
	infoLogsPath: vine.string().optional(),
	errorLogsPath: vine.string().optional(),
});

const databaseConfigSchema = vine.object({
	host: vine.string().ipAddress(),
	port: vine.number({ strict: true }).withoutDecimals().range([0, 65535]),
	user: vine.string(),
	password: vine.string(),
	database: vine.string(),
	ssl: vine.boolean({ strict: true }),
});

const redisConfigSchema = vine.object({
	host: vine.string().ipAddress(),
	port: vine.number({ strict: true }).withoutDecimals().range([0, 65535]),
	user: vine.string(),
	password: vine.string(),
	database: vine.number({ strict: true }),
});

const emailConfigSchema = vine.object({
	host: vine.string(),
	port: vine
		.number({ strict: true })
		.withoutDecimals()
		.in([587, 465, 25, 2525]),
	user: vine.string(),
	password: vine.string(),
	secure: vine.boolean({ strict: true }),
	from: vine.string(),
});

const cloudinaryConfig = vine.object({
	cloudName: vine.string(),
	apiKey: vine.string(),
	apiSecret: vine.string(),
});

const configSchema = vine.object({
	application: applicationConfigSchema,
	logger: loggerConfigSchema,
	database: databaseConfigSchema,
	redis: redisConfigSchema,
	email: emailConfigSchema,
	cloudinary: cloudinaryConfig,
});

export type ApplicationConfig = InferInput<typeof applicationConfigSchema>;
export type LoggerConfig = InferInput<typeof loggerConfigSchema>;
export type DatabaseConfig = InferInput<typeof databaseConfigSchema>;
export type RedisConfig = InferInput<typeof redisConfigSchema>;
export type EmailConfig = InferInput<typeof emailConfigSchema>;
export type CloudinaryConfig = InferInput<typeof cloudinaryConfig>;
export type Config = InferInput<typeof configSchema>;

const setMethodsOnConfigs = (config: Config) => {
	Object.defineProperty(config.database, "connectionString", {
		configurable: false,
		enumerable: false,
		writable: false,
		value: () =>
			`postgres://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.database}`,
	});
};

const freezeConfig = (config: Config) => {
	for (const key of Object.keys(config)) {
		Object.freeze(config[key as keyof Config]);
	}

	Object.freeze(config);
};

const setLogPaths = (config: LoggerConfig) => {
	const infoLogPath =
		config.infoLogsPath || path.join(import.meta.dirname, "../logs/info.log");
	const errorLogPath =
		config.errorLogsPath || path.join(import.meta.dirname, "../logs/error.log");

	const infoLogDir = path.dirname(infoLogPath);
	const errorLogDir = path.dirname(errorLogPath);

	if (!existsSync(infoLogDir)) {
		mkdirSync(infoLogDir, { recursive: true });
	}

	if (!existsSync(infoLogPath)) {
		openSync(infoLogPath, constants.O_WRONLY | constants.O_CREAT);
	}
	if (!existsSync(errorLogDir)) {
		mkdirSync(errorLogDir, { recursive: true });
	}

	if (!existsSync(errorLogPath)) {
		openSync(errorLogPath, constants.O_WRONLY | constants.O_CREAT);
	}

	config.infoLogsPath = infoLogPath;
	config.errorLogsPath = errorLogPath;
};

export const readConfig = async (allowChanging = false): Promise<Config> => {
	const env = process.env.NODE_ENV || Environment.Development;
	const configPath = path.join(import.meta.dirname, `../configs/${env}.yaml`);

	try {
		const data = yaml.load(readFileSync(configPath, "utf-8"));
		const config = await vine.validate({ schema: configSchema, data });

		setLogPaths(config.logger);
		setMethodsOnConfigs(config);

		if (!allowChanging) {
			freezeConfig(config);
		}

		return config;
	} catch (error) {
		console.log("Failed to read config: ", error);
		process.exit(1);
	}
};
