import vine from '@vinejs/vine'
import type { InferInput } from '@vinejs/vine/types'
import yaml from 'js-yaml'
import { existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { constants } from 'node:fs/promises'
import path from 'node:path'
import { Environment } from './common/enums/environment.enum.js'
import { LogLevel } from './common/enums/log-level.enum.js'

const applicationConfigSchema = vine.object({
  port: vine.number({ strict: true }).range([0, 65535]),
  host: vine.string().ipAddress(),
  environment: vine.enum(Environment),
  cookieSecret: vine.string().minLength(32),
  sessionTtlInMinutes: vine.number({ strict: true }).range([60, 43800]),
})

const loggerConfigSchema = vine.object({
  logLevel: vine.enum(LogLevel),
  infoLogsPath: vine.string().optional(),
  errorLogsPath: vine.string().optional(),
})

const databaseConfigSchema = vine.object({
  host: vine.string().ipAddress(),
  port: vine.number({ strict: true }).withoutDecimals().range([0, 65535]),
  user: vine.string(),
  password: vine.string(),
  database: vine.string(),
  ssl: vine.boolean({ strict: true }),
})

const redisConfigSchema = vine.object({
  host: vine.string().ipAddress(),
  port: vine.number({ strict: true }).withoutDecimals().range([0, 65535]),
  password: vine.string(),
  database: vine.number({ strict: true }),
})

const configSchema = vine.object({
  application: applicationConfigSchema,
  logger: loggerConfigSchema,
  database: databaseConfigSchema,
  redis: redisConfigSchema,
})

export type ApplicationConfig = InferInput<typeof applicationConfigSchema>
export type LoggerConfig = InferInput<typeof loggerConfigSchema>
export type DatabaseConfig = InferInput<typeof databaseConfigSchema>
export type RedisConfig = InferInput<typeof redisConfigSchema>
export type Config = InferInput<typeof configSchema>

const setMethodsOnConfigs = (config: Config) => {
  Object.defineProperty(config.database, 'connectionString', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: () =>
      `postgres://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.database}`,
  })
}

const freezeConfig = (config: Config) => {
  for (const key of Object.keys(config)) {
    Object.freeze(config[key as keyof Config])
  }

  Object.freeze(config)
}

export const readConfig = async (allowChanging = false): Promise<Config> => {
  const env = process.env.NODE_ENV || Environment.Development
  const configPath = path.join(import.meta.dirname, `../configs/${env}.yaml`)

  try {
    const data = yaml.load(readFileSync(configPath, 'utf-8'))
    const config = await vine.validate({ schema: configSchema, data })

    const infoLogPath =
      config.logger.infoLogsPath ||
      path.join(import.meta.dirname, '../logs/info.log')
    const errorLogPath =
      config.logger.errorLogsPath ||
      path.join(import.meta.dirname, '../logs/error.log')

    const infoLogDir = path.dirname(infoLogPath)
    const errorLogDir = path.dirname(errorLogPath)

    if (!existsSync(infoLogDir)) {
      mkdirSync(infoLogDir, { recursive: true })
    }

    if (!existsSync(infoLogPath)) {
      openSync(infoLogPath, constants.O_WRONLY | constants.O_CREAT)
    }
    if (!existsSync(errorLogDir)) {
      mkdirSync(errorLogDir, { recursive: true })
    }

    if (!existsSync(errorLogPath)) {
      openSync(errorLogPath, constants.O_WRONLY | constants.O_CREAT)
    }

    config.logger.infoLogsPath = infoLogPath
    config.logger.errorLogsPath = errorLogPath

    setMethodsOnConfigs(config)

    if (!allowChanging) {
      freezeConfig(config)
    }

    return config
  } catch (error) {
    console.log('Failed to read config: ', error)
    process.exit(1)
  }
}
