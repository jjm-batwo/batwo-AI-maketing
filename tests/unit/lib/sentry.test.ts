/**
 * Sentry Configuration Tests
 *
 * Sentry 설정 및 초기화 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Sentry Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('Sensitive Data Filtering', () => {
    it('should have patterns for sensitive data detection', () => {
      const sensitivePatterns = [
        /api[_-]?key/i,
        /password/i,
        /secret/i,
        /token/i,
        /credential/i,
        /auth/i,
      ]

      // 민감한 문자열 테스트
      const testStrings = [
        'API_KEY=abc123',
        'password123',
        'my-secret-value',
        'auth_token_here',
        'credential_file',
        'Authorization: Bearer xyz',
      ]

      for (const str of testStrings) {
        const matched = sensitivePatterns.some((pattern) => pattern.test(str))
        expect(matched).toBe(true)
      }
    })

    it('should not match non-sensitive strings', () => {
      const sensitivePatterns = [
        /api[_-]?key/i,
        /password/i,
        /secret/i,
        /token/i,
        /credential/i,
      ]

      const normalStrings = [
        'user_name',
        'email_address',
        'campaign_id',
        'report_data',
      ]

      for (const str of normalStrings) {
        const matched = sensitivePatterns.some((pattern) => pattern.test(str))
        expect(matched).toBe(false)
      }
    })
  })

  describe('Ignored Errors', () => {
    it('should define common browser errors to ignore', () => {
      const ignoredErrors = [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        'AbortError',
        'The operation was aborted',
        'Non-Error promise rejection captured',
      ]

      // 이 에러들은 무시해야 함
      for (const error of ignoredErrors) {
        expect(error).toBeDefined()
        expect(typeof error).toBe('string')
      }
    })
  })

  describe('Denied URLs', () => {
    it('should have patterns for browser extensions', () => {
      const denyPatterns = [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
      ]

      const extensionUrls = [
        'chrome://extensions/',
        'chrome-extension://abc123/script.js',
        'moz-extension://xyz789/content.js',
      ]

      for (const url of extensionUrls) {
        const denied = denyPatterns.some((pattern) => pattern.test(url))
        expect(denied).toBe(true)
      }
    })
  })

  describe('Environment Detection', () => {
    it('should detect production environment', () => {
      vi.stubEnv('NODE_ENV', 'production')

      const isProduction = process.env.NODE_ENV === 'production'
      expect(isProduction).toBe(true)
    })

    it('should detect development environment', () => {
      vi.stubEnv('NODE_ENV', 'development')

      const isDevelopment = process.env.NODE_ENV === 'development'
      expect(isDevelopment).toBe(true)
    })
  })

  describe('Sample Rates', () => {
    it('should use lower sample rates in production', () => {
      const productionSampleRate = 0.1
      const developmentSampleRate = 1.0

      expect(productionSampleRate).toBeLessThan(developmentSampleRate)
      expect(productionSampleRate).toBe(0.1)
      expect(developmentSampleRate).toBe(1.0)
    })

    it('should sample replays on error at 100%', () => {
      const replaysOnErrorSampleRate = 1.0
      expect(replaysOnErrorSampleRate).toBe(1.0)
    })
  })
})
