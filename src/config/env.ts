import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3001'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32)
    .default('development-access-secret-change-before-production'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default('development-refresh-secret-change-before-production'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(3600)
    .default(60 * 60 * 24 * 7),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(12).optional(),
  REDIS_URL: z.string().url().optional(),
  STALE_INCIDENT_HOURS: z.coerce.number().int().min(1).default(24),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === 'postgresql:' || protocol === 'postgres:';
    }, 'DATABASE_URL must be a PostgreSQL connection string.'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.issues
    .map((issue) => {
      return `${issue.path.join('.')}: ${issue.message}`;
    })
    .join('; ');

  throw new Error(`Invalid environment configuration: ${errors}`);
}

export const env = parsedEnv.data;
