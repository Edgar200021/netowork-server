import { type Logger, destination, multistream, pino } from 'pino'
import type { Config } from '../../config.js'
import { Environment } from '../enums/environment.enum.js'

export class LoggerService {
  private static _instance: null | LoggerService = null
  //@ts-ignore
  private readonly _logger: Logger

  constructor(readonly config: Config) {
    if (LoggerService._instance) return LoggerService._instance
    LoggerService._instance = this

    if (config.application.environment === Environment.Production) {
      this._logger = pino(
        {
          level: config.logger.logLevel,
          formatters: {
            level: label => ({ level: label }),
          },
          timestamp: pino.stdTimeFunctions.isoTime,
        },
        multistream([
          {
            level: 'info',
            stream: destination(config.logger.infoLogsPath!),
          },
          {
            level: 'error',
            stream: destination(config.logger.errorLogsPath!),
          },
        ])
      )

      return
    }

    this._logger = pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss Z',
        },
      },
      level: 'debug',
      timestamp: pino.stdTimeFunctions.isoTime,
    })
  }

  info(message: string) {
    this._logger.info(message, {})
  }

  debug(message: string) {
    this._logger.debug(message)
  }

  error(message: string) {
    this._logger.error(message)
  }

  warn(message: string) {
    this._logger.warn(message)
  }
}
