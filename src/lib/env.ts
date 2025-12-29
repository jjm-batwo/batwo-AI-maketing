import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates all required environment variables at build/runtime
 */

// Server-side environment variables (not exposed to browser)
const serverEnvSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database (Supabase)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(), // For migrations with connection pooling

  // Auth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // External APIs
  META_APP_ID: z.string().min(1, 'META_APP_ID is required'),
  META_APP_SECRET: z.string().min(1, 'META_APP_SECRET is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  // OAuth Providers (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),

  // Monitoring (optional in dev, required in prod)
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Rate Limiting (optional)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

// Client-side environment variables (exposed to browser via NEXT_PUBLIC_ prefix)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

// Production-specific validation
const productionServerEnvSchema = serverEnvSchema.extend({
  SENTRY_DSN: z.string().min(1, 'SENTRY_DSN is required in production'),
});

/**
 * Validate server environment variables
 */
function validateServerEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const schema = isProduction ? productionServerEnvSchema : serverEnvSchema;

  const result = schema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid server environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables');
  }

  return result.data;
}

/**
 * Validate client environment variables
 */
function validateClientEnv() {
  const clientEnv = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  };

  const result = clientEnvSchema.safeParse(clientEnv);

  if (!result.success) {
    console.error('❌ Invalid client environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  return result.data;
}

// Validate at module load time (build time for server components)
const serverEnv = validateServerEnv();
const clientEnv = validateClientEnv();

/**
 * Type-safe server environment access
 */
export const env = {
  ...serverEnv,
  ...clientEnv,
} as const;

/**
 * Type-safe client environment access (safe for browser)
 */
export const clientEnvSafe = clientEnv;

// Export types for external use
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
