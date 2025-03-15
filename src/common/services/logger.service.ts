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
          {
            level: 'fatal',
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

  info(message: string, ...args: any[]): void
  info(obj: object, message?: string, ...args: any[]): void
  info(error: Error, message?: string, ...args: any[]): void
  info(arg1: string | object | Error, arg2?: string, ...args: any[]): void {
    this._logger?.info(arg1 as any, arg2, ...args)
  }

  debug(message: string, ...args: any[]): void
  debug(obj: object, message?: string, ...args: any[]): void
  debug(error: Error, message?: string, ...args: any[]): void
  debug(arg1: string | object | Error, arg2?: string, ...args: any[]): void {
    this._logger?.debug(arg1 as any, arg2, ...args)
  }

  warn(message: string, ...args: any[]): void
  warn(obj: object, message?: string, ...args: any[]): void
  warn(error: Error, message?: string, ...args: any[]): void
  warn(arg1: string | object | Error, arg2?: string, ...args: any[]): void {
    this._logger?.warn(arg1 as any, arg2, ...args)
  }

  error(message: string, ...args: any[]): void
  error(obj: object, message?: string, ...args: any[]): void
  error(error: Error, message?: string, ...args: any[]): void
  error(arg1: string | object | Error, arg2?: string, ...args: any[]): void {
    this._logger?.error(arg1 as any, arg2, ...args)
  }

  fatal(message: string, ...args: any[]): void
  fatal(obj: object, message?: string, ...args: any[]): void
  fatal(error: Error, message?: string, ...args: any[]): void
  fatal(arg1: string | object | Error, arg2?: string, ...args: any[]): void {
    this._logger?.fatal(arg1 as any, arg2, ...args)
  }
}
