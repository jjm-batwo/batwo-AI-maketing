/**
 * KPI Cache Module
 *
 * Simple in-memory cache for dashboard KPI data with TTL support.
 * Cache keys are based on userId + dateRange for proper isolation.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class KPICache {
  private cache = new Map<string, CacheEntry<unknown>>()

  /**
   * Get cached data if available and not expired
   */
  getCached<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cache with TTL in seconds
   */
  setCache<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { data, expiresAt })
  }

  /**
   * Invalidate cache entries matching a pattern
   * Pattern supports simple prefix matching (e.g., "user:123" matches "user:123:*")
   */
  invalidateCache(pattern: string): void {
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => {
      this.cache.delete(key)
    })
  }

  /**
   * Generate cache key for KPI queries
   */
  generateKPIKey(userId: string, period: string, comparison: boolean, breakdown: boolean): string {
    return `kpi:${userId}:${period}:${comparison}:${breakdown}`
  }

  /**
   * Generate invalidation pattern for a user
   */
  getUserPattern(userId: string): string {
    return `kpi:${userId}:`
  }

  /**
   * Clear all cache entries (for testing/debugging)
   */
  clearAll(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    this.cache.forEach((entry) => {
      if (now > (entry as CacheEntry<unknown>).expiresAt) {
        expiredEntries++
      } else {
        validEntries++
      }
    })

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
    }
  }
}

// Singleton instance
export const kpiCache = new KPICache()

// Export functions for convenience
export const getCached = <T>(key: string): T | null => kpiCache.getCached<T>(key)
export const setCache = <T>(key: string, data: T, ttlSeconds: number): void =>
  kpiCache.setCache(key, data, ttlSeconds)
export const invalidateCache = (pattern: string): void => kpiCache.invalidateCache(pattern)
export const generateKPIKey = (userId: string, period: string, comparison: boolean, breakdown: boolean): string =>
  kpiCache.generateKPIKey(userId, period, comparison, breakdown)
export const getUserPattern = (userId: string): string => kpiCache.getUserPattern(userId)
