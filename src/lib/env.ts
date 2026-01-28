import { z } from 'zod'

/**
 * Server-side environment variables schema
 * These are only available on the server
 */
const serverEnvSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database (Required)
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),
  DIRECT_URL: z.string().optional(), // For Prisma migrations with connection pooling

  // NextAuth (Required)
  NEXTAUTH_URL: z
    .string()
    .min(1, 'NEXTAUTH_URL is required')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'NEXTAUTH_URL must be a valid URL'
    ),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  AUTH_SECRET: z.string().optional(), // NextAuth v5 alternative to NEXTAUTH_SECRET

  // Meta Ads API (Optional - required for Meta integration)
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),

  // OpenAI API (Optional - required for AI features)
  OPENAI_API_KEY: z.string().optional(),

  // OAuth Providers (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),

  // Email Service (Optional - required for notifications and reports)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Cafe24 Platform Integration (Optional)
  CAFE24_CLIENT_ID: z.string().optional(),
  CAFE24_CLIENT_SECRET: z.string().optional(),
  CAFE24_REDIRECT_URI: z.string().url().optional(),

  // Research API (Optional - Phase 3)
  PERPLEXITY_API_KEY: z.string().optional(),
  RESEARCH_ENABLED: z.string().optional(), // "true" to enable research service

  // Cron Job Security (Recommended for production)
  CRON_SECRET: z.string().optional(),

  // Monitoring - Sentry (Optional)
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),

  // Rate Limiting - Upstash Redis (Optional)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Internal Flags (Development/Testing)
  SKIP_DATABASE_ADAPTER: z.string().optional(), // Set to 'true' to skip PrismaAdapter
  WARMUP_ACCOUNT_ID: z.string().optional(), // For Meta API warmup scripts

  // CI/CD Environment
  CI: z.string().optional(), // Continuous Integration flag
  NEXT_RUNTIME: z.enum(['nodejs', 'edge']).optional(), // Next.js runtime detection
})

/**
 * Client-side environment variables schema
 * These are exposed to the browser (NEXT_PUBLIC_ prefix)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_RELEASE: z.string().optional(),
  NEXT_PUBLIC_META_APP_ID: z.string().optional(),
})

/**
 * Parse and validate server environment variables
 */
function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${messages?.join(', ')}`)
      .join('\n')

    throw new Error(
      `\n❌ Invalid environment variables:\n${errorMessages}\n\n` +
        `Please check your .env file or environment configuration.`
    )
  }

  return parsed.data
}

/**
 * Parse and validate client environment variables
 */
function validateClientEnv() {
  const clientEnv = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    NEXT_PUBLIC_META_APP_ID: process.env.NEXT_PUBLIC_META_APP_ID,
  }

  const parsed = clientEnvSchema.safeParse(clientEnv)

  if (!parsed.success) {
    console.warn('Warning: Some public environment variables are invalid')
  }

  return parsed.success ? parsed.data : clientEnv
}

/**
 * Validated server environment variables
 * @throws Error if required variables are missing or invalid
 */
export const env = validateServerEnv()

/**
 * Validated client environment variables
 * Safe to use in client components
 */
export const publicEnv = validateClientEnv()

/**
 * Environment detection helpers
 */
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'

/**
 * Type exports for environment variables
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>
