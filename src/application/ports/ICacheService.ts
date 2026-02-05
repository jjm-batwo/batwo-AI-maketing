/**
 * Cache Service Port
 *
 * Interface for cache operations.
 * Implementations can use Redis, in-memory cache, or other backends.
 */

export interface ICacheService {
  /**
   * Get a value from cache
   * @returns The cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON serialized)
   * @param ttlSeconds Time to live in seconds (optional)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>

  /**
   * Delete a specific key from cache
   */
  delete(key: string): Promise<void>

  /**
   * Delete all keys matching a pattern (e.g., "user:*")
   * @param pattern Redis pattern with wildcards
   */
  deletePattern(pattern: string): Promise<void>

  /**
   * Invalidate all cache entries for a specific user
   * @param userId User ID
   */
  invalidateUserCache(userId: string): Promise<void>

  /**
   * Check if cache service is connected and operational
   */
  isHealthy(): Promise<boolean>
}
