/**
 * Unit tests for Cron Authentication Middleware
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { validateCronAuth } from '@/lib/middleware/cronAuth'

describe('validateCronAuth', () => {
  const originalEnv = process.env.CRON_SECRET

  afterEach(() => {
    // Restore original environment
    if (originalEnv === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = originalEnv
    }
  })

  describe('Security: CRON_SECRET not configured', () => {
    it('should return 500 when CRON_SECRET is undefined', () => {
      delete process.env.CRON_SECRET

      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        headers: {
          authorization: 'Bearer some-token',
        },
      })

      const result = validateCronAuth(request)

      expect(result.authorized).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(500)
    })

    it('should return 500 when CRON_SECRET is empty string', () => {
      process.env.CRON_SECRET = ''

      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        headers: {
          authorization: 'Bearer some-token',
        },
      })

      const result = validateCronAuth(request)

      expect(result.authorized).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(500)
    })

    it('should return 500 when CRON_SECRET is whitespace only', () => {
      process.env.CRON_SECRET = '   '

      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        headers: {
          authorization: 'Bearer some-token',
        },
      })

      const result = validateCronAuth(request)

      expect(result.authorized).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(500)
    })
  })

  describe('Authorization validation', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'test-secret-key'
    })

    it('should authorize valid Bearer token', () => {
      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        headers: {
          authorization: 'Bearer test-secret-key',
        },
      })

      const result = validateCronAuth(request)

      expect(result.authorized).toBe(true)
      expect(result.response).toBeUndefined()
    })

    it('should reject missing authorization header', () => {
      const request = new NextRequest('http://localhost:3000/api/cron/test')

      const result = validateCronAuth(request)

      expect(result.authorized).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(401)
    })

    it('should reject wrong Bearer token', () => {
      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        headers: {
          authorization: 'Bearer wrong-token',
        },
      })

      const result = validateCronAuth(request)

      expect(result.authorized).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(401)
    })

    it('should reject malformed authorization header (no Bearer prefix)', () => {
      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        headers: {
          authorization: 'test-secret-key',
        },
      })

      const result = validateCronAuth(request)

      expect(result.authorized).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(401)
    })

    it('should reject authorization header with wrong scheme', () => {
      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        headers: {
          authorization: 'Basic test-secret-key',
        },
      })

      const result = validateCronAuth(request)

      expect(result.authorized).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.response?.status).toBe(401)
    })
  })

  describe('Error response format', () => {
    it('should return JSON error for 500 response', async () => {
      delete process.env.CRON_SECRET

      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        headers: {
          authorization: 'Bearer some-token',
        },
      })

      const result = validateCronAuth(request)
      const json = await result.response?.json()

      expect(json).toEqual({
        error: 'Server configuration error: CRON_SECRET not set',
      })
    })

    it('should return JSON error for 401 response', async () => {
      process.env.CRON_SECRET = 'test-secret'

      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        headers: {
          authorization: 'Bearer wrong-token',
        },
      })

      const result = validateCronAuth(request)
      const json = await result.response?.json()

      expect(json).toEqual({
        error: 'Unauthorized',
      })
    })
  })
})
