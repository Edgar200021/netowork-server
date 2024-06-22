import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/env.validation';

export const emailConfig = (
  configService: ConfigService<EnvironmentVariables, true>,
): MailerOptions => {
  return {
    transport: {
      host: configService.get('SMTP_HOST'),
      port: Number(configService.get('SMTP_PORT')),
      secure: configService.get('NODE_ENV') === 'production',
      auth: {
        pass: configService.get('SMTP_PASSWORD'),
        user: configService.get('SMTP_USER'),
      },
      from: configService.get('SMTP_USER'),
    },
  };
};
