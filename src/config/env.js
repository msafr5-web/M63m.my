'use strict';

require('dotenv').config({ quiet: true });
const { z } = require('zod');

const bool = (fallback) =>
  z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === 'true' || v === '1'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),
  CLUSTER_WORKERS: z.string().default('1'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_COST: z.coerce.number().int().min(12).max(15).default(12),
  CORS_ORIGINS: z.string().default(''),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_SSL: bool(false),
  DB_SYNC: bool(false),
  DB_LOG_SQL: bool(false),

  REDIS_URL: z.string().optional().default(''),

  X_BEARER_TOKEN: z.string().optional().default(''),
  FACEBOOK_PAGE_ID: z.string().optional().default(''),
  FACEBOOK_PAGE_ACCESS_TOKEN: z.string().optional().default(''),
  TIKTOK_ACCESS_TOKEN: z.string().optional().default(''),
  SNAPCHAT_ACCESS_TOKEN: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // Fail fast: running with a broken configuration is worse than not starting.
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const env = parsed.data;

module.exports = Object.freeze({
  ...env,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
});
