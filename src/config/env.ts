import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3001'),
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
