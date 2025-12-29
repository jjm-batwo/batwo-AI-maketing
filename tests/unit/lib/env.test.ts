import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Environment Variables Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Required Variables', () => {
    it('should validate all required environment variables are present', async () => {
      // Set all required env vars
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long'

      const { env } = await import('@/lib/env')

      expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db')
      expect(env.NEXTAUTH_URL).toBe('http://localhost:3000')
      expect(env.NEXTAUTH_SECRET).toBe('test-secret-at-least-32-characters-long')
    })

    it('should throw error when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long'

      await expect(import('@/lib/env')).rejects.toThrow()
    })

    it('should throw error when NEXTAUTH_SECRET is missing', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      delete process.env.NEXTAUTH_SECRET

      await expect(import('@/lib/env')).rejects.toThrow()
    })
  })

  describe('Optional Variables', () => {
    it('should allow optional variables to be undefined', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long'
      delete process.env.META_APP_ID
      delete process.env.OPENAI_API_KEY

      const { env } = await import('@/lib/env')

      expect(env.META_APP_ID).toBeUndefined()
      expect(env.OPENAI_API_KEY).toBeUndefined()
    })

    it('should parse optional variables when provided', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long'
      process.env.META_APP_ID = 'meta-app-123'
      process.env.META_APP_SECRET = 'meta-secret-456'
      process.env.OPENAI_API_KEY = 'sk-test-key'

      const { env } = await import('@/lib/env')

      expect(env.META_APP_ID).toBe('meta-app-123')
      expect(env.META_APP_SECRET).toBe('meta-secret-456')
      expect(env.OPENAI_API_KEY).toBe('sk-test-key')
    })
  })

  describe('URL Validation', () => {
    it('should validate DATABASE_URL format', async () => {
      process.env.DATABASE_URL = 'not-a-valid-url'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long'

      await expect(import('@/lib/env')).rejects.toThrow()
    })

    it('should validate NEXTAUTH_URL format', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_URL = 'not-a-valid-url'
      process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long'

      await expect(import('@/lib/env')).rejects.toThrow()
    })
  })

  describe('Environment Detection', () => {
    it('should detect production environment', async () => {
      ;(process.env as Record<string, string>).NODE_ENV = 'production'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_URL = 'https://batwo.ai'
      process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long'

      const { isProduction, isDevelopment } = await import('@/lib/env')

      expect(isProduction).toBe(true)
      expect(isDevelopment).toBe(false)
    })

    it('should detect development environment', async () => {
      ;(process.env as Record<string, string>).NODE_ENV = 'development'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long'

      const { isProduction, isDevelopment } = await import('@/lib/env')

      expect(isProduction).toBe(false)
      expect(isDevelopment).toBe(true)
    })
  })

  describe('Public Variables', () => {
    it('should expose public variables for client-side', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_URL = 'http://localhost:3000'
      process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long'
      process.env.NEXT_PUBLIC_APP_URL = 'https://batwo.ai'
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://sentry.io/123'

      const { publicEnv } = await import('@/lib/env')

      expect(publicEnv.NEXT_PUBLIC_APP_URL).toBe('https://batwo.ai')
      expect(publicEnv.NEXT_PUBLIC_SENTRY_DSN).toBe('https://sentry.io/123')
    })
  })
})
