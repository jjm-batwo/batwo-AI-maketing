/**
 * In-Memory Cache Service
 *
 * Fallback cache implementation for local development without Redis.
 * Uses a simple Map with TTL support and pattern matching.
 *
 * ⚠️ WARNING: This is NOT suitable for production use in multi-instance deployments.
 * Each instance will have its own cache, leading to inconsistencies.
 */

import type { ICacheService } from '@application/ports/ICacheService'

interface CacheEntry<T> {
  value: T
  expiresAt: number | null
}

export class MemoryCacheService implements ICacheService {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this.cache.set(key, { value, expiresAt })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async deletePattern(pattern: string): Promise<void> {
    // Convert Redis pattern to RegExp
    // * becomes .*, ? becomes .
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    const regex = new RegExp(`^${regexPattern}$`)

    const keysToDelete: string[] = []
    const allKeys = Array.from(this.cache.keys())
    for (const key of allKeys) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }

    console.log(`[MemoryCache] Deleted ${keysToDelete.length} keys matching pattern: ${pattern}`)
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const pattern = `*:${userId}*`
    await this.deletePattern(pattern)
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    const value = await fetcher()
    await this.set(key, value, ttlSeconds)
    return value
  }

  async isHealthy(): Promise<boolean> {
    return true
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let deletedCount = 0

    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      console.log(`[MemoryCache] Cleaned up ${deletedCount} expired entries`)
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }
}
