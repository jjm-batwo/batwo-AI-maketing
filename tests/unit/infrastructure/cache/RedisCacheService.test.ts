/**
 * Redis Cache Service Tests
 *
 * Tests for the Redis cache implementation.
 * Uses ioredis-mock for testing without a real Redis instance.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RedisCacheService } from '@infrastructure/cache/RedisCacheService'
// import Redis from 'ioredis-mock'

// Mock ioredis to use ioredis-mock
vi.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock')
  return {
    default: RedisMock,
    Redis: RedisMock,
  }
})

describe('RedisCacheService', () => {
  let cacheService: RedisCacheService

  beforeEach(() => {
    cacheService = new RedisCacheService('redis://localhost:6379')
  })

  afterEach(async () => {
    await cacheService.disconnect()
  })

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('should return cached value', async () => {
      const key = 'test-key'
      const value = { foo: 'bar', count: 42 }

      await cacheService.set(key, value)
      const result = await cacheService.get<typeof value>(key)

      expect(result).toEqual(value)
    })

    it('should handle primitive values', async () => {
      await cacheService.set('string-key', 'hello')
      await cacheService.set('number-key', 123)
      await cacheService.set('boolean-key', true)

      expect(await cacheService.get('string-key')).toBe('hello')
      expect(await cacheService.get('number-key')).toBe(123)
      expect(await cacheService.get('boolean-key')).toBe(true)
    })

    it('should handle complex objects', async () => {
      const complexObject = {
        user: {
          id: '123',
          name: 'Test User',
          roles: ['admin', 'user'],
        },
        metadata: {
          createdAt: '2024-01-01T00:00:00Z',
          tags: ['tag1', 'tag2'],
        },
      }

      await cacheService.set('complex-key', complexObject)
      const result = await cacheService.get('complex-key')

      expect(result).toEqual(complexObject)
    })
  })

  describe('set', () => {
    it('should set value without TTL', async () => {
      const key = 'persistent-key'
      const value = { data: 'test' }

      await cacheService.set(key, value)
      const result = await cacheService.get<typeof value>(key)

      expect(result).toEqual(value)
    })

    it('should set value with TTL', async () => {
      const key = 'ttl-key'
      const value = { data: 'expires' }

      await cacheService.set(key, value, 1) // 1 second TTL
      const result = await cacheService.get<typeof value>(key)

      expect(result).toEqual(value)

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1100))

      const expiredResult = await cacheService.get(key)
      expect(expiredResult).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete existing key', async () => {
      const key = 'delete-key'
      await cacheService.set(key, 'value')

      expect(await cacheService.get(key)).toBe('value')

      await cacheService.delete(key)

      expect(await cacheService.get(key)).toBeNull()
    })

    it('should not throw when deleting non-existent key', async () => {
      await expect(cacheService.delete('non-existent')).resolves.not.toThrow()
    })
  })

  describe('deletePattern', () => {
    beforeEach(async () => {
      // Set up test data
      await cacheService.set('user:123:profile', { name: 'User 123' })
      await cacheService.set('user:123:settings', { theme: 'dark' })
      await cacheService.set('user:456:profile', { name: 'User 456' })
      await cacheService.set('campaign:789', { status: 'active' })
    })

    it('should delete all keys matching pattern', async () => {
      await cacheService.deletePattern('user:123:*')

      expect(await cacheService.get('user:123:profile')).toBeNull()
      expect(await cacheService.get('user:123:settings')).toBeNull()
      expect(await cacheService.get('user:456:profile')).not.toBeNull()
      expect(await cacheService.get('campaign:789')).not.toBeNull()
    })

    it('should delete all user keys with wildcard', async () => {
      await cacheService.deletePattern('user:*')

      expect(await cacheService.get('user:123:profile')).toBeNull()
      expect(await cacheService.get('user:123:settings')).toBeNull()
      expect(await cacheService.get('user:456:profile')).toBeNull()
      expect(await cacheService.get('campaign:789')).not.toBeNull()
    })

    it('should handle pattern with no matches', async () => {
      await expect(cacheService.deletePattern('nonexistent:*')).resolves.not.toThrow()
    })
  })

  describe('invalidateUserCache', () => {
    beforeEach(async () => {
      await cacheService.set('kpi:dashboard:user123', { data: 'kpi' })
      await cacheService.set('campaigns:list:user123', { data: 'campaigns' })
      await cacheService.set('quota:status:user123', { data: 'quota' })
      await cacheService.set('kpi:dashboard:user456', { data: 'other-kpi' })
    })

    it('should delete all cache entries for a user', async () => {
      await cacheService.invalidateUserCache('user123')

      expect(await cacheService.get('kpi:dashboard:user123')).toBeNull()
      expect(await cacheService.get('campaigns:list:user123')).toBeNull()
      expect(await cacheService.get('quota:status:user123')).toBeNull()
      expect(await cacheService.get('kpi:dashboard:user456')).not.toBeNull()
    })
  })

  describe('isHealthy', () => {
    it('should return true when Redis is connected', async () => {
      const healthy = await cacheService.isHealthy()
      expect(healthy).toBe(true)
    })
  })

  describe('CacheKeys integration', () => {
    it('should work with CacheKeys helper', async () => {
      const { CacheKeys, CacheTTL } = await import('@infrastructure/cache/CacheKeys')

      const userId = 'test-user-123'
      const kpiData = { revenue: 10000, clicks: 500 }

      await cacheService.set(CacheKeys.kpiDashboard(userId), kpiData, CacheTTL.KPI)

      const result = await cacheService.get(CacheKeys.kpiDashboard(userId))
      expect(result).toEqual(kpiData)
    })
  })
})
