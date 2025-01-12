import dotenv from 'dotenv'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import { Config, configSchema } from '../schemas/config'

export const loadConfig = (): Config => {
  dotenv.config()
  const env = process.env.NODE_ENV || 'development'

  const configPath = path.join(__dirname, '../../configs', `${env}.yaml`)

  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`)
    process.exit(1)
  }

  const loadedConfig = yaml.load(fs.readFileSync(configPath, 'utf-8'))

  return configSchema.parse(loadedConfig)
}

export const config = loadConfig()
