import { type Transporter, createTransport } from 'nodemailer'
import type { ApplicationConfig, EmailConfig } from '../../config.js'
import { InternalServerError } from '../error.js'
import type { LoggerService } from './logger.service.js'

export class EmailService {
  private readonly _clientUrl: string
  private readonly _accountVerificationPath: string

  private readonly _transport: Transporter
  constructor(
    appConfig: ApplicationConfig,
    { host, port, user, password, secure, from }: EmailConfig,
    private readonly _logger: LoggerService
  ) {
    this._accountVerificationPath = appConfig.accountVerificationPath
    this._clientUrl = appConfig.clientUrl

    this._transport = createTransport({
      host,
      port: Number(port),
      auth: {
        user,
        pass: password,
      },
      secure: Boolean(secure),
	  requireTLS:true,
      from,
    })
  }

  async sendVerificationEmail(
    to: string,
    token: string,
    logger?: LoggerService
  ) {
    const log = logger ?? this._logger
    const subject = 'Email Verification'
    const url = `${this._clientUrl}${this._accountVerificationPath}?token=${encodeURIComponent(token)}`

    const text = `Please click the link to verify your email: ${url}`
    const html = `<p>Please click the link to verify your email: <a href="${url}">${url}</a></p>`

    try {
      await this._transport.sendMail({
        to,
        subject,
        text,
        html,
      })

      log.info(`Verification email sent to ${to} successfully`)
    } catch (error) {
      log.error(
        { email: to, error: error instanceof Error ? error.message : error },
        'Failed to send verification email',
        error
      )
      throw new InternalServerError('Failed to send verification email')
    }
  }
}
