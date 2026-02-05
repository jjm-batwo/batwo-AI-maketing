/**
 * Memory Cache Service Tests
 *
 * Tests for the in-memory cache fallback implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryCacheService } from '@infrastructure/cache/MemoryCacheService'

describe('MemoryCacheService', () => {
  let cacheService: MemoryCacheService

  beforeEach(() => {
    cacheService = new MemoryCacheService()
  })

  afterEach(() => {
    cacheService.destroy()
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

    it('should return null for expired key', async () => {
      const key = 'expired-key'
      const value = 'expires'

      await cacheService.set(key, value, 1) // 1 second TTL

      // Immediately should still be available
      expect(await cacheService.get(key)).toBe(value)

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100))

      expect(await cacheService.get(key)).toBeNull()
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

      await cacheService.set(key, value, 2) // 2 seconds TTL
      const result = await cacheService.get<typeof value>(key)

      expect(result).toEqual(value)
    })

    it('should overwrite existing value', async () => {
      const key = 'overwrite-key'

      await cacheService.set(key, 'first')
      expect(await cacheService.get(key)).toBe('first')

      await cacheService.set(key, 'second')
      expect(await cacheService.get(key)).toBe('second')
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

    it('should handle wildcard patterns', async () => {
      await cacheService.deletePattern('user:*')

      expect(await cacheService.get('user:123:profile')).toBeNull()
      expect(await cacheService.get('user:456:profile')).toBeNull()
      expect(await cacheService.get('campaign:789')).not.toBeNull()
    })

    it('should handle question mark wildcards', async () => {
      await cacheService.set('test1', 'value1')
      await cacheService.set('test2', 'value2')
      await cacheService.set('test10', 'value10')

      await cacheService.deletePattern('test?')

      expect(await cacheService.get('test1')).toBeNull()
      expect(await cacheService.get('test2')).toBeNull()
      expect(await cacheService.get('test10')).not.toBeNull()
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
    it('should always return true', async () => {
      const healthy = await cacheService.isHealthy()
      expect(healthy).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('should automatically clean up expired entries', async () => {
      // Set multiple entries with short TTL
      await cacheService.set('expire1', 'value1', 1)
      await cacheService.set('expire2', 'value2', 1)
      await cacheService.set('persist', 'value3')

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Manually trigger cleanup (normally happens every minute)
      await cacheService['cleanup']()

      expect(await cacheService.get('expire1')).toBeNull()
      expect(await cacheService.get('expire2')).toBeNull()
      expect(await cacheService.get('persist')).toBe('value3')
    })
  })
})
