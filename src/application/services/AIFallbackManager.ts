/**
 * AI Fallback Manager
 *
 * 3-tier graceful degradation system for AI features:
 * Advanced AI (Opus) → Basic AI (Haiku) → Static Templates
 *
 * Ensures core functionality never blocks on AI failures.
 */

export type FallbackTier = 'advanced' | 'basic' | 'template'

export interface FallbackConfig {
  maxRetries: number
  timeoutMs: number
  enabledTiers: FallbackTier[]
}

export interface FallbackResult<T> {
  data: T
  tier: FallbackTier
  wasDowngraded: boolean
  originalError?: string
}

interface TierHealth {
  advanced: boolean
  basic: boolean
  lastAdvancedCheck: Date
  lastBasicCheck: Date
  advancedFailCount: number
  basicFailCount: number
}

const DEFAULT_CONFIG: FallbackConfig = {
  maxRetries: 2,
  timeoutMs: 30000, // 30 seconds
  enabledTiers: ['advanced', 'basic', 'template'],
}

const HEALTH_RESET_THRESHOLD = 5 // Reset after 5 consecutive failures
const HEALTH_CHECK_INTERVAL = 60000 // 1 minute

export class AIFallbackManager {
  private config: FallbackConfig
  private health: TierHealth

  constructor(config?: Partial<FallbackConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.health = {
      advanced: true,
      basic: true,
      lastAdvancedCheck: new Date(),
      lastBasicCheck: new Date(),
      advancedFailCount: 0,
      basicFailCount: 0,
    }
  }

  /**
   * Execute operation with automatic fallback through tiers
   */
  async executeWithFallback<T>(
    advanced: () => Promise<T>,
    basic: () => Promise<T>,
    template: () => T
  ): Promise<FallbackResult<T>> {
    const enabledTiers = this.config.enabledTiers
    let lastError: Error | undefined

    // Try Advanced AI tier
    if (enabledTiers.includes('advanced') && this.health.advanced) {
      try {
        const data = await this.executeWithTimeout(
          advanced,
          this.config.timeoutMs,
          this.config.maxRetries
        )
        this.recordSuccess('advanced')
        return {
          data,
          tier: 'advanced',
          wasDowngraded: false,
        }
      } catch (error) {
        lastError = error as Error
        this.recordFailure('advanced')
        console.warn('Advanced AI tier failed, falling back to basic:', error)
      }
    }

    // Try Basic AI tier
    if (enabledTiers.includes('basic') && this.health.basic) {
      try {
        const data = await this.executeWithTimeout(
          basic,
          this.config.timeoutMs,
          this.config.maxRetries
        )
        this.recordSuccess('basic')
        return {
          data,
          tier: 'basic',
          wasDowngraded: true,
          originalError: lastError?.message,
        }
      } catch (error) {
        lastError = error as Error
        this.recordFailure('basic')
        console.warn('Basic AI tier failed, falling back to template:', error)
      }
    }

    // Fallback to Template
    if (enabledTiers.includes('template')) {
      try {
        const data = template()
        return {
          data,
          tier: 'template',
          wasDowngraded: true,
          originalError: lastError?.message,
        }
      } catch (_error) {
        // Even template failed - this should never happen
        throw new Error(
          `All fallback tiers failed. Last error: ${lastError?.message || 'Unknown'}`
        )
      }
    }

    throw new Error('No enabled fallback tiers available')
  }

  /**
   * Execute with timeout and retries
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await Promise.race([
          fn(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
          ),
        ])
      } catch (error) {
        lastError = error as Error
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    throw lastError || new Error('Operation failed')
  }

  /**
   * Record successful execution for a tier
   */
  private recordSuccess(tier: 'advanced' | 'basic'): void {
    if (tier === 'advanced') {
      this.health.advanced = true
      this.health.advancedFailCount = 0
      this.health.lastAdvancedCheck = new Date()
    } else {
      this.health.basic = true
      this.health.basicFailCount = 0
      this.health.lastBasicCheck = new Date()
    }
  }

  /**
   * Record failed execution for a tier
   */
  private recordFailure(tier: 'advanced' | 'basic'): void {
    if (tier === 'advanced') {
      this.health.advancedFailCount++
      this.health.lastAdvancedCheck = new Date()
      if (this.health.advancedFailCount >= HEALTH_RESET_THRESHOLD) {
        this.health.advanced = false
        // Auto-recover after cooldown
        setTimeout(() => {
          this.health.advanced = true
          this.health.advancedFailCount = 0
        }, HEALTH_CHECK_INTERVAL)
      }
    } else {
      this.health.basicFailCount++
      this.health.lastBasicCheck = new Date()
      if (this.health.basicFailCount >= HEALTH_RESET_THRESHOLD) {
        this.health.basic = false
        // Auto-recover after cooldown
        setTimeout(() => {
          this.health.basic = true
          this.health.basicFailCount = 0
        }, HEALTH_CHECK_INTERVAL)
      }
    }
  }

  /**
   * Get current health status of AI tiers
   */
  getHealthStatus(): {
    advanced: boolean
    basic: boolean
    advancedFailCount: number
    basicFailCount: number
    lastChecks: { advanced: Date; basic: Date }
  } {
    return {
      advanced: this.health.advanced,
      basic: this.health.basic,
      advancedFailCount: this.health.advancedFailCount,
      basicFailCount: this.health.basicFailCount,
      lastChecks: {
        advanced: this.health.lastAdvancedCheck,
        basic: this.health.lastBasicCheck,
      },
    }
  }

  /**
   * Manually reset health status (for testing or admin override)
   */
  resetHealth(): void {
    this.health = {
      advanced: true,
      basic: true,
      lastAdvancedCheck: new Date(),
      lastBasicCheck: new Date(),
      advancedFailCount: 0,
      basicFailCount: 0,
    }
  }

  /**
   * Force disable a specific tier (for maintenance or testing)
   */
  disableTier(tier: 'advanced' | 'basic'): void {
    if (tier === 'advanced') {
      this.health.advanced = false
    } else {
      this.health.basic = false
    }
  }

  /**
   * Force enable a specific tier
   */
  enableTier(tier: 'advanced' | 'basic'): void {
    if (tier === 'advanced') {
      this.health.advanced = true
      this.health.advancedFailCount = 0
    } else {
      this.health.basic = true
      this.health.basicFailCount = 0
    }
  }
}
