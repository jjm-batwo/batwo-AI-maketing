/**
 * AISuggestionTiming
 *
 * Controls when and how often to show AI suggestions.
 * Prevents suggestion fatigue and learns from user responses.
 *
 * Design Philosophy:
 * - Respect user attention
 * - Learn from responses
 * - Adaptive timing
 */

export interface SuggestionConfig {
  minTimeBetweenSuggestions: number // milliseconds
  maxSuggestionsPerSession: number
  contextThreshold: number // 0-1 confidence threshold
}

export interface SuggestionStats {
  shown: number
  accepted: number
  dismissed: number
  acceptanceRate: number
}

interface SuggestionRecord {
  timestamp: Date
  accepted: boolean | null // null = still pending
}

const DEFAULT_CONFIG: SuggestionConfig = {
  minTimeBetweenSuggestions: 5 * 60 * 1000, // 5 minutes
  maxSuggestionsPerSession: 3,
  contextThreshold: 0.6
}

export class AISuggestionTiming {
  private config: SuggestionConfig
  private suggestions: SuggestionRecord[] = []
  private sessionStartTime: Date
  private lastSuggestionTime: Date | null = null

  constructor(config?: Partial<SuggestionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionStartTime = new Date()
  }

  /**
   * Check if now is a good time to suggest AI
   */
  canSuggestNow(): boolean {
    // Check max suggestions per session
    if (this.suggestions.length >= this.config.maxSuggestionsPerSession) {
      return false
    }

    // Check minimum time between suggestions
    if (this.lastSuggestionTime) {
      const timeSinceLastSuggestion = Date.now() - this.lastSuggestionTime.getTime()
      if (timeSinceLastSuggestion < this.config.minTimeBetweenSuggestions) {
        return false
      }
    }

    // Adaptive: If user has been dismissing, increase wait time
    const recentDismissals = this.getRecentDismissals(3)
    if (recentDismissals >= 2) {
      // User dismissed last 2 suggestions - wait longer
      const extraWaitTime = this.config.minTimeBetweenSuggestions * 2
      if (this.lastSuggestionTime) {
        const timeSinceLastSuggestion = Date.now() - this.lastSuggestionTime.getTime()
        if (timeSinceLastSuggestion < extraWaitTime) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Record that a suggestion was shown
   */
  recordSuggestion(): void {
    this.suggestions.push({
      timestamp: new Date(),
      accepted: null
    })
    this.lastSuggestionTime = new Date()
  }

  /**
   * Record user response to suggestion
   */
  recordResponse(accepted: boolean): void {
    // Update the most recent pending suggestion
    const pendingSuggestion = this.suggestions
      .slice()
      .reverse()
      .find(s => s.accepted === null)

    if (pendingSuggestion) {
      pendingSuggestion.accepted = accepted

      // Adaptive learning: If user keeps accepting, suggest more often
      if (accepted) {
        const acceptanceRate = this.getStats().acceptanceRate
        if (acceptanceRate > 0.7) {
          // User likes suggestions - reduce wait time slightly
          this.config.minTimeBetweenSuggestions = Math.max(
            2 * 60 * 1000, // Minimum 2 minutes
            this.config.minTimeBetweenSuggestions * 0.8
          )
        }
      } else {
        // User dismissed - increase wait time
        const dismissalRate = 1 - this.getStats().acceptanceRate
        if (dismissalRate > 0.7) {
          // User doesn't like suggestions - increase wait time
          this.config.minTimeBetweenSuggestions = Math.min(
            15 * 60 * 1000, // Maximum 15 minutes
            this.config.minTimeBetweenSuggestions * 1.2
          )
        }
      }
    }
  }

  /**
   * Get count of recent dismissals
   */
  private getRecentDismissals(count: number): number {
    return this.suggestions
      .slice(-count)
      .filter(s => s.accepted === false)
      .length
  }

  /**
   * Get suggestion statistics
   */
  getStats(): SuggestionStats {
    const shown = this.suggestions.length
    const responded = this.suggestions.filter(s => s.accepted !== null)
    const accepted = responded.filter(s => s.accepted === true).length
    const dismissed = responded.filter(s => s.accepted === false).length

    return {
      shown,
      accepted,
      dismissed,
      acceptanceRate: responded.length > 0 ? accepted / responded.length : 0
    }
  }

  /**
   * Get time until next suggestion is allowed
   */
  getTimeUntilNextSuggestion(): number {
    if (!this.lastSuggestionTime) {
      return 0
    }

    const timeSinceLastSuggestion = Date.now() - this.lastSuggestionTime.getTime()
    const remainingTime = this.config.minTimeBetweenSuggestions - timeSinceLastSuggestion

    return Math.max(0, remainingTime)
  }

  /**
   * Check if should suggest based on context confidence
   */
  shouldSuggestForConfidence(confidence: number): boolean {
    return confidence >= this.config.contextThreshold
  }

  /**
   * Reset session (useful for testing or new sessions)
   */
  resetSession(): void {
    this.suggestions = []
    this.sessionStartTime = new Date()
    this.lastSuggestionTime = null
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime.getTime()
  }

  /**
   * Export session data (for analytics)
   */
  exportSessionData(): {
    config: SuggestionConfig
    stats: SuggestionStats
    sessionDuration: number
    suggestions: Array<{
      timestamp: string
      accepted: boolean | null
    }>
  } {
    return {
      config: this.config,
      stats: this.getStats(),
      sessionDuration: this.getSessionDuration(),
      suggestions: this.suggestions.map(s => ({
        timestamp: s.timestamp.toISOString(),
        accepted: s.accepted
      }))
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SuggestionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): SuggestionConfig {
    return { ...this.config }
  }
}

/**
 * Singleton instance for global use
 */
let globalInstance: AISuggestionTiming | null = null

export function getAISuggestionTiming(): AISuggestionTiming {
  if (!globalInstance) {
    globalInstance = new AISuggestionTiming()
  }
  return globalInstance
}

/**
 * Reset global instance (useful for testing)
 */
export function resetAISuggestionTiming(): void {
  globalInstance = null
}

/**
 * Create isolated instance (useful for testing or multiple contexts)
 */
export function createAISuggestionTiming(config?: Partial<SuggestionConfig>): AISuggestionTiming {
  return new AISuggestionTiming(config)
}
