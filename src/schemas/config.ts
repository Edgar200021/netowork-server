import { z } from 'zod'

const smtpConfig = z.object({
  host: z.string().nonempty(),
  port: z.number(),
  username: z.string().nonempty(),
  password: z.string().nonempty(),
  from: z.string().nonempty(),
})

export type SmtpConfig = z.infer<typeof smtpConfig>

const redisConfig = z.object({
  host: z.string().nonempty(),
  port: z.number().min(0).max(65535),
  username: z.string().nonempty().default('default'),
  password: z.string().optional(),
  database: z.number().default(0),
})

export type RedisConfig = z.infer<typeof redisConfig>

const databaseConfig = z.object({
  user: z.string().nonempty(),
  password: z.string().nonempty(),
  host: z.string().nonempty(),
  port: z.number().min(0).max(65535),
  database: z.string().nonempty(),
  ssl: z.boolean(),
})

export type DatabaseConfig = z.infer<typeof databaseConfig>

const applicationConfig = z.object({
  port: z.number().min(0).max(65535),
  host: z.string().nonempty(),
  clientUrl: z.string().nonempty(),
  accountVerificationPath: z.string().nonempty(),
  accountVerificationTtlInMinutes: z.number().min(10),
  cookieSecret: z.string().nonempty(),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  loginSessionTtlInMinutes: z.number().min(1440),
})

export type ApplicationConfig = z.infer<typeof applicationConfig>

export const configSchema = z.object({
  application: applicationConfig,
  database: databaseConfig,
  redis: redisConfig,
  smtp: smtpConfig,
})

export type Config = z.infer<typeof configSchema>
