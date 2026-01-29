/**
 * ContextDetectionEngine
 *
 * Detects user context based on actions and behaviors to determine
 * when AI assistance might be helpful.
 *
 * Design Philosophy:
 * - Passive observation, never intrusive
 * - Learn from patterns
 * - Respect user flow
 */

export type UserContext =
  | 'creating_campaign'
  | 'analyzing_metrics'
  | 'writing_copy'
  | 'reviewing_performance'
  | 'stuck_on_task'
  | 'idle'

export interface ContextSignal {
  type: UserContext
  confidence: number // 0-1
  triggers: string[] // What triggered this detection
  timestamp: Date
}

export interface ActionMetadata {
  duration?: number // How long on this page/action
  repeatCount?: number // How many times repeated
  errorOccurred?: boolean
  valueChanged?: boolean
  [key: string]: unknown
}

interface ActionRecord {
  action: string
  metadata: ActionMetadata
  timestamp: Date
}

interface ContextRule {
  context: UserContext
  detect: (actions: ActionRecord[]) => { match: boolean; confidence: number; triggers: string[] }
}

export class ContextDetectionEngine {
  private actions: ActionRecord[] = []
  private currentContext: ContextSignal | null = null
  private listeners: ((context: ContextSignal) => void)[] = []
  private maxHistorySize = 50

  private contextRules: ContextRule[] = [
    {
      context: 'creating_campaign',
      detect: (actions) => {
        const recentActions = actions.slice(-5)
        const campaignActions = recentActions.filter(a =>
          a.action.includes('campaign') || a.action.includes('create')
        )

        if (campaignActions.length >= 2) {
          return {
            match: true,
            confidence: Math.min(campaignActions.length / 5, 1),
            triggers: campaignActions.map(a => a.action)
          }
        }

        return { match: false, confidence: 0, triggers: [] }
      }
    },
    {
      context: 'analyzing_metrics',
      detect: (actions) => {
        const recentActions = actions.slice(-5)
        const metricActions = recentActions.filter(a =>
          a.action.includes('view_metrics') ||
          a.action.includes('view_dashboard') ||
          a.action.includes('analyze')
        )

        if (metricActions.length >= 2) {
          return {
            match: true,
            confidence: Math.min(metricActions.length / 4, 1),
            triggers: metricActions.map(a => a.action)
          }
        }

        return { match: false, confidence: 0, triggers: [] }
      }
    },
    {
      context: 'writing_copy',
      detect: (actions) => {
        const recentActions = actions.slice(-5)
        const writingActions = recentActions.filter(a =>
          a.action.includes('edit_copy') ||
          a.action.includes('write') ||
          a.action.includes('input_text')
        )

        // Check if user is struggling (multiple edits)
        const repeatEdits = recentActions.filter(a =>
          a.metadata.repeatCount && a.metadata.repeatCount > 2
        )

        if (writingActions.length >= 2 || repeatEdits.length > 0) {
          return {
            match: true,
            confidence: Math.min((writingActions.length + repeatEdits.length) / 5, 1),
            triggers: [...writingActions, ...repeatEdits].map(a => a.action)
          }
        }

        return { match: false, confidence: 0, triggers: [] }
      }
    },
    {
      context: 'reviewing_performance',
      detect: (actions) => {
        const recentActions = actions.slice(-5)
        const reviewActions = recentActions.filter(a =>
          a.action.includes('view_report') ||
          a.action.includes('review') ||
          a.action.includes('performance')
        )

        if (reviewActions.length >= 2) {
          return {
            match: true,
            confidence: Math.min(reviewActions.length / 4, 1),
            triggers: reviewActions.map(a => a.action)
          }
        }

        return { match: false, confidence: 0, triggers: [] }
      }
    },
    {
      context: 'stuck_on_task',
      detect: (actions) => {
        const recentActions = actions.slice(-10)

        // Detect stuck: repeated actions, errors, long duration
        const repeatedActions = new Map<string, number>()
        recentActions.forEach(a => {
          const count = repeatedActions.get(a.action) || 0
          repeatedActions.set(a.action, count + 1)
        })

        const hasRepeats = Array.from(repeatedActions.values()).some(count => count >= 3)
        const hasErrors = recentActions.some(a => a.metadata.errorOccurred)
        const longDuration = recentActions.some(a =>
          a.metadata.duration && a.metadata.duration > 60000 // 1 minute
        )

        if (hasRepeats || hasErrors || longDuration) {
          const triggers: string[] = []
          if (hasRepeats) triggers.push('repeated_actions')
          if (hasErrors) triggers.push('errors_occurred')
          if (longDuration) triggers.push('long_duration')

          return {
            match: true,
            confidence: 0.8,
            triggers
          }
        }

        return { match: false, confidence: 0, triggers: [] }
      }
    },
    {
      context: 'idle',
      detect: (actions) => {
        if (actions.length === 0) {
          return { match: true, confidence: 1, triggers: ['no_actions'] }
        }

        const lastAction = actions[actions.length - 1]
        const timeSinceLastAction = Date.now() - lastAction.timestamp.getTime()

        // Idle if no action for 30 seconds
        if (timeSinceLastAction > 30000) {
          return {
            match: true,
            confidence: Math.min(timeSinceLastAction / 60000, 1), // Max at 1 minute
            triggers: [`idle_${Math.floor(timeSinceLastAction / 1000)}s`]
          }
        }

        return { match: false, confidence: 0, triggers: [] }
      }
    }
  ]

  /**
   * Track user action
   */
  trackAction(action: string, metadata: ActionMetadata = {}): void {
    const record: ActionRecord = {
      action,
      metadata,
      timestamp: new Date()
    }

    this.actions.push(record)

    // Keep history size manageable
    if (this.actions.length > this.maxHistorySize) {
      this.actions = this.actions.slice(-this.maxHistorySize)
    }

    // Update context
    this.updateContext()
  }

  /**
   * Update current context based on recent actions
   */
  private updateContext(): void {
    const detections = this.contextRules
      .map(rule => {
        const result = rule.detect(this.actions)
        return {
          context: rule.context,
          ...result
        }
      })
      .filter(d => d.match)
      .sort((a, b) => b.confidence - a.confidence)

    const topDetection = detections[0]

    if (topDetection) {
      const newContext: ContextSignal = {
        type: topDetection.context,
        confidence: topDetection.confidence,
        triggers: topDetection.triggers,
        timestamp: new Date()
      }

      // Only notify if context changed or confidence increased significantly
      const shouldNotify =
        !this.currentContext ||
        this.currentContext.type !== newContext.type ||
        newContext.confidence - this.currentContext.confidence > 0.2

      this.currentContext = newContext

      if (shouldNotify) {
        this.notifyListeners(newContext)
      }
    }
  }

  /**
   * Get current context
   */
  getCurrentContext(): ContextSignal | null {
    return this.currentContext
  }

  /**
   * Subscribe to context changes
   */
  onContextChange(callback: (context: ContextSignal) => void): () => void {
    this.listeners.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(context: ContextSignal): void {
    this.listeners.forEach(listener => {
      try {
        listener(context)
      } catch (error) {
        console.error('Error in context change listener:', error)
      }
    })
  }

  /**
   * Check if AI suggestion is appropriate right now
   */
  shouldSuggestAI(): { suggest: boolean; reason: string } {
    const context = this.getCurrentContext()

    if (!context) {
      return { suggest: false, reason: 'No clear context detected' }
    }

    // Don't suggest if idle
    if (context.type === 'idle') {
      return { suggest: false, reason: 'User is idle' }
    }

    // Suggest if confidence is high enough
    if (context.confidence >= 0.6) {
      return {
        suggest: true,
        reason: `User is ${context.type.replace(/_/g, ' ')} (confidence: ${context.confidence.toFixed(2)})`
      }
    }

    return {
      suggest: false,
      reason: `Confidence too low (${context.confidence.toFixed(2)})`
    }
  }

  /**
   * Clear action history (useful for testing)
   */
  clearHistory(): void {
    this.actions = []
    this.currentContext = null
  }

  /**
   * Get action history (for debugging)
   */
  getHistory(): ActionRecord[] {
    return [...this.actions]
  }
}

/**
 * Singleton instance for global use
 */
let globalInstance: ContextDetectionEngine | null = null

export function getContextDetectionEngine(): ContextDetectionEngine {
  if (!globalInstance) {
    globalInstance = new ContextDetectionEngine()
  }
  return globalInstance
}

/**
 * Reset global instance (useful for testing)
 */
export function resetContextDetectionEngine(): void {
  globalInstance = null
}
