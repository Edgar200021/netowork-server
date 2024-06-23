import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { EnvironmentVariables } from 'src/env.validation';

@Injectable()
export class EmailService {
  private verificationHtml: string = fs.readFileSync(
    path.join(__dirname, '../../../public/verify-email.html'),
    {
      flag: 'r',
      encoding: 'utf-8',
    },
  );
  private resetPasswordHtml: string = fs.readFileSync(
    path.join(__dirname, '../../../public/reset-password.html'),
    {
      flag: 'r',
      encoding: 'utf-8',
    },
  );

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    options?: ISendMailOptions,
  ) {
    const url = `${this.configService.get('CLIENT_VERIFICATION_URL')}?email=${to}&token=${verificationToken}`;
    try {
      await this.mailerService.sendMail({
        ...options,
        to,
        subject: 'Верификация почты',
        html: this.verificationHtml.replace('{{ url }}', url),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendResetPasswordEmail(
    to: string,
    verificationToken: string,
    options?: ISendMailOptions,
  ) {
    const url = `${this.configService.get('CLIENT_RESET_PASSWORD_URL')}?email=${to}&token=${verificationToken}`;
    try {
      await this.mailerService.sendMail({
        ...options,
        to,
        subject: 'Восстановление пароля',
        html: this.resetPasswordHtml.replace('{{ url }}', url),
      });
    } catch (error) {
      console.log(error);
    }
  }
}
