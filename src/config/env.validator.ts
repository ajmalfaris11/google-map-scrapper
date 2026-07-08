import { z } from 'zod';
import { config } from 'dotenv';

config();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string").default("postgres://user:pass@localhost:5432/db"),
  HEADLESS: z.enum(['true', 'false']).default('true'),
  KEYWORD: z.string().min(1, "KEYWORD is required").default("Resorts"),
  MAX_RESULTS: z.string().transform(Number).default('50'),
  SCROLL_DELAY: z.string().transform(Number).default('1000'),
  SCROLL_STEP: z.string().transform(Number).default('1000'),
  MAX_IDLE_SCROLLS: z.string().transform(Number).default('10'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  MAX_RETRIES: z.string().transform(Number).default('3'),
  PAGE_TIMEOUT: z.string().transform(Number).default('30000'),
  CONCURRENCY: z.string().transform(Number).default('3'),
  QUEUE_HIGH_WATER_MARK: z.string().transform(Number).default('50'),
  QUEUE_LOW_WATER_MARK: z.string().transform(Number).default('20'),
  MAX_TEST_BUSINESSES: z.string().transform(Number).default('200')
});

export const env = envSchema.parse(process.env);
