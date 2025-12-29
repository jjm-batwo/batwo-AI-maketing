/**
 * Error Reporting Tests
 *
 * 에러 리포팅 유틸리티 단위 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 모킹된 스코프 타입 정의
interface MockScope {
  setLevel: ReturnType<typeof vi.fn>
  setUser: ReturnType<typeof vi.fn>
  setTag: ReturnType<typeof vi.fn>
  setContext: ReturnType<typeof vi.fn>
  setFingerprint: ReturnType<typeof vi.fn>
}

// Sentry 모듈 모킹
const mockScope: MockScope = {
  setLevel: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  setFingerprint: vi.fn(),
}

vi.mock('@sentry/nextjs', () => {
  return {
    withScope: vi.fn((callback: (scope: MockScope) => void) => callback(mockScope)),
    captureException: vi.fn(() => 'test-event-id'),
    captureMessage: vi.fn(() => 'test-message-id'),
    captureFeedback: vi.fn(),
    setUser: vi.fn(),
    addBreadcrumb: vi.fn(),
    lastEventId: vi.fn(() => 'test-event-id'),
  }
})

// 테스트 전에 모듈 가져오기 (모킹 후)
import {
  reportError,
  reportApiError,
  reportErrorWithFeedback,
  reportMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
} from '@/lib/errors/reportError'
import * as Sentry from '@sentry/nextjs'

// 모킹된 스코프 접근
const getMockScope = (): MockScope => mockScope

describe('Error Reporting Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('reportError', () => {
    it('should capture Error instances', () => {
      const error = new Error('Test error')
      const eventId = reportError(error)

      expect(Sentry.withScope).toHaveBeenCalled()
      expect(Sentry.captureException).toHaveBeenCalledWith(error)
      expect(eventId).toBe('test-event-id')
    })

    it('should convert non-Error values to Error', () => {
      reportError('string error')

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'string error',
        })
      )
    })

    it('should set component and action tags', () => {
      reportError(new Error('Test'), {
        component: 'TestComponent',
        action: 'testAction',
      })

      const scope = getMockScope()
      expect(scope.setTag).toHaveBeenCalledWith('component', 'TestComponent')
      expect(scope.setTag).toHaveBeenCalledWith('action', 'testAction')
    })

    it('should set severity level', () => {
      reportError(new Error('Test'), {
        severity: 'warning',
      })

      const scope = getMockScope()
      expect(scope.setLevel).toHaveBeenCalledWith('warning')
    })

    it('should set user context when userId provided', () => {
      reportError(new Error('Test'), {
        userId: 'user-123',
      })

      const scope = getMockScope()
      expect(scope.setUser).toHaveBeenCalledWith({ id: 'user-123' })
    })

    it('should set fingerprint when provided', () => {
      reportError(new Error('Test'), {
        fingerprint: ['custom', 'fingerprint'],
      })

      const scope = getMockScope()
      expect(scope.setFingerprint).toHaveBeenCalledWith(['custom', 'fingerprint'])
    })
  })

  describe('reportApiError', () => {
    it('should add API-specific context', () => {
      const request = new Request('https://example.com/api/test?foo=bar', {
        method: 'POST',
      })

      reportApiError(new Error('API Error'), request)

      const scope = getMockScope()
      expect(scope.setTag).toHaveBeenCalledWith('component', 'API')
      expect(scope.setTag).toHaveBeenCalledWith('api_route', '/api/test')
      expect(scope.setTag).toHaveBeenCalledWith('http_method', 'POST')
    })
  })

  describe('reportErrorWithFeedback', () => {
    it('should capture error and user feedback', () => {
      const error = new Error('Test error')
      const feedback = {
        name: 'Test User',
        email: 'test@example.com',
        comments: 'Something went wrong',
      }

      reportErrorWithFeedback(error, feedback)

      expect(Sentry.captureException).toHaveBeenCalled()
      expect(Sentry.captureFeedback).toHaveBeenCalledWith({
        associatedEventId: 'test-event-id',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Something went wrong',
      })
    })

    it('should use default values for anonymous feedback', () => {
      const error = new Error('Test error')
      const feedback = {
        comments: 'Anonymous feedback',
      }

      reportErrorWithFeedback(error, feedback)

      expect(Sentry.captureFeedback).toHaveBeenCalledWith({
        associatedEventId: 'test-event-id',
        name: 'Anonymous',
        email: 'anonymous@example.com',
        message: 'Anonymous feedback',
      })
    })
  })

  describe('reportMessage', () => {
    it('should capture message with level', () => {
      reportMessage('Test message', 'info')

      const scope = getMockScope()
      expect(scope.setLevel).toHaveBeenCalledWith('info')
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message')
    })

    it('should set tags and context', () => {
      reportMessage('Test message', 'warning', {
        component: 'TestComponent',
        tags: { custom: 'tag' },
        extra: { data: 'value' },
      })

      const scope = getMockScope()
      expect(scope.setTag).toHaveBeenCalledWith('component', 'TestComponent')
      expect(scope.setTag).toHaveBeenCalledWith('custom', 'tag')
      expect(scope.setContext).toHaveBeenCalledWith('messageContext', { data: 'value' })
    })
  })

  describe('setUserContext', () => {
    it('should set user in Sentry', () => {
      setUserContext({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      })

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        username: 'Test User',
      })
    })
  })

  describe('clearUserContext', () => {
    it('should clear user in Sentry', () => {
      clearUserContext()

      expect(Sentry.setUser).toHaveBeenCalledWith(null)
    })
  })

  describe('addBreadcrumb', () => {
    it('should add breadcrumb to Sentry', () => {
      addBreadcrumb('User clicked button', 'ui.click', { buttonId: 'submit' })

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked button',
        category: 'ui.click',
        data: { buttonId: 'submit' },
        level: 'info',
        timestamp: expect.any(Number),
      })
    })
  })
})
