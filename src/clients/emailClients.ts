import nodemailer, { Transporter } from 'nodemailer'
import { config } from '../config/config'
import { ApplicationConfig, SmtpConfig } from '../schemas/config'

class EmailClient {
  private readonly _transporter: Transporter
  private readonly _applicationConfig: ApplicationConfig

  constructor(config: SmtpConfig, applicationConfig: ApplicationConfig) {
    this._transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: applicationConfig.nodeEnv === 'production',
      auth: {
        user: config.username,
        pass: config.password,
      },
      from: config.from,
    })

    this._applicationConfig = applicationConfig
  }

  public async sendAccountVerificationEmail(to: string, token: string) {
    const html = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="X-UA-Compatible" content="IE=edge">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Document</title>
		</head>
		<body>
			<h1>Verify your account</h1>
			<p>Click the link below to verify your account</p>
			<a href="${this._applicationConfig.clientUrl}${this._applicationConfig.accountVerificationPath}?token=${token}">Verify</a>
		</body>
		</html>
	`,
      text =
        'Click the link below to verify your account\n' +
        this._applicationConfig.clientUrl +
        this._applicationConfig.accountVerificationPath +
        '?token=' +
        token

    await this._transporter.sendMail({
      to,
      html,
      text,
      subject: 'Account verification',
    })
  }

  public async sendResetPasswordEmail(to: string, token: string) {
    const html = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="X-UA-Compatible" content="IE=edge">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Document</title>
		</head>
		<body>
			<h1>Reset your password</h1>
			<p>Click the link below to reset your password</p>
			<a href="${this._applicationConfig.clientUrl}${this._applicationConfig.passwordResetPath}?token=${token}">Reset</a>
		</body>
		</html>
		`,
      text =
        'Click the link below to reset your password\n' +
        this._applicationConfig.clientUrl +
        this._applicationConfig.passwordResetPath +
        '?token=' +
        token

    await this._transporter.sendMail({
      to,
      html,
      text,
      subject: 'Reset your password',
    })
  }
}

export const emailClient = new EmailClient(config.smtp, config.application)
