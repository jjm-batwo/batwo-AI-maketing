/**
 * Redis Cache Service
 *
 * Production-ready Redis cache implementation using ioredis.
 * Provides automatic JSON serialization, TTL support, and pattern-based invalidation.
 */

import { Redis } from 'ioredis'
import type { ICacheService } from '@application/ports/ICacheService'

export class RedisCacheService implements ICacheService {
  private client: Redis

  constructor(redisUrl?: string) {
    this.client = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError(err) {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true
        }
        return false
      },
    })

    this.client.on('error', (error) => {
      console.error('[Redis] Connection error:', error)
    })

    this.client.on('connect', () => {
      console.log('[Redis] Connected successfully')
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`[Redis] Error getting key ${key}:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized)
      } else {
        await this.client.set(key, serialized)
      }
    } catch (error) {
      console.error(`[Redis] Error setting key ${key}:`, error)
      // Fail silently - cache failures should not break the app
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      console.error(`[Redis] Error deleting key ${key}:`, error)
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      // Use SCAN for better performance with large datasets
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      })

      const pipeline = this.client.pipeline()
      let deleteCount = 0

      stream.on('data', (keys: string[]) => {
        for (const key of keys) {
          pipeline.del(key)
          deleteCount++
        }
      })

      await new Promise<void>((resolve, reject) => {
        stream.on('end', () => {
          if (deleteCount > 0) {
            pipeline.exec().then(() => {
              console.log(`[Redis] Deleted ${deleteCount} keys matching pattern: ${pattern}`)
              resolve()
            }).catch(reject)
          } else {
            resolve()
          }
        })
        stream.on('error', reject)
      })
    } catch (error) {
      console.error(`[Redis] Error deleting pattern ${pattern}:`, error)
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    const value = await fetcher()
    await this.set(key, value, ttlSeconds)
    return value
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const pattern = `*:${userId}*`
    await this.deletePattern(pattern)
  }

  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.client.ping()
      return pong === 'PONG'
    } catch (error) {
      console.error('[Redis] Health check failed:', error)
      return false
    }
  }

  /**
   * Close the Redis connection
   * Call this on application shutdown
   */
  async disconnect(): Promise<void> {
    await this.client.quit()
  }
}
