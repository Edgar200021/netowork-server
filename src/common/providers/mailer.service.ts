import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter, createTransport } from 'nodemailer';
import {
  ApplicationConfig,
  Config,
  SmtpConfig,
} from 'src/config/configuration';

@Injectable()
export class MailerService {
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService<Config, true>) {
    const appConfig = config.getOrThrow<ApplicationConfig>('application'),
      smtpConfig = config.getOrThrow<SmtpConfig>('smtp');

    this.transporter = createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },

      from: smtpConfig.from,
      secure: appConfig.environment === 'production',
    });
  }

  async sendEmail(to: string, subject: string, text: string, html: string) {
    await this.transporter.sendMail({
      to,
      subject,
      text,
      html,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const appConfig = this.config.getOrThrow<ApplicationConfig>('application');

    const verificationUrl = new URL(
      `${appConfig.clientApplication.url}${appConfig.clientApplication.accountVerificationPath}`,
    );

    verificationUrl.searchParams.set('token', token);

    const subject = 'Verify your email address',
      text = `Please verify your email address by clicking on the link below:\n\n${verificationUrl}`,
      html = `
	<p>Please verify your email address by clicking on the link below:</p>
	<a href="${verificationUrl}">Verify email</a>	
		`;

    await this.sendEmail(to, subject, text, html);
  }
}
