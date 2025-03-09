import { type Logger, destination, multistream, pino } from 'pino'
import type { Config } from '../../config.js'
import { Environment } from '../enums/environment.enum.js'

export class LoggerService {
  private static _instance: null | LoggerService = null
  private readonly _logger: Logger | null = null

  constructor(readonly config: Config) {
    if (config.application.environment === Environment.Production) {
      this._logger = pino(
        {
          level: config.logger.logLevel,
          formatters: {
            level: label => ({ level: label.toUpperCase() }),
          },
          timestamp: pino.stdTimeFunctions.isoTime,
          //  redact: []
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
      level: config.logger.logLevel,
      timestamp: pino.stdTimeFunctions.isoTime,
    })
  }

  info(message: string, ...args: unknown[]) {
    this._logger?.info(message, args)
  }

  debug(message: string, ...args: unknown[]) {
    this._logger?.debug(message, args)
  }

  error(message: string, ...args: unknown[]) {
    this._logger?.error(message, args)
  }

  warn(message: string, ...args: unknown[]) {
    this._logger?.warn(message, args)
  }
}
