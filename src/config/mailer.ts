import { ConfigService } from '@nestjs/config';
import { Config } from './configuration';

export const mailerConfig = async (config: ConfigService<Config, true>) => {};
