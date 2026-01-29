/**
 * Background Analysis Service
 *
 * Provides ambient/proactive AI insights by analyzing data in the background
 * without user action. Insights appear when relevant but don't interrupt workflow.
 *
 * Key Features:
 * - Non-blocking queue-based task processing
 * - Priority-based task scheduling
 * - Observer pattern for real-time result streaming
 * - Automatic deduplication
 */

export type AnalysisTaskType =
  | 'anomaly'
  | 'trend'
  | 'opportunity'
  | 'recommendation'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface AnalysisTask {
  id: string
  type: AnalysisTaskType
  context: Record<string, unknown>
  priority: TaskPriority
  scheduledAt?: Date
  createdAt: Date
}

export interface AnalysisResult {
  taskId: string
  type: AnalysisTaskType
  insight: string
  confidence: number // 0-100
  actionable: boolean
  suggestedAction?: {
    label: string
    url?: string
    handler?: string
  }
  metadata?: Record<string, unknown>
  createdAt: Date
}

type ResultCallback = (result: AnalysisResult) => void

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

/**
 * BackgroundAnalysisService
 *
 * Manages a queue of analysis tasks and processes them in priority order.
 * Results are streamed to subscribers via observer pattern.
 */
export class BackgroundAnalysisService {
  private tasks: Map<string, AnalysisTask> = new Map()
  private processedTaskIds: Set<string> = new Set()
  private subscribers: Set<ResultCallback> = new Set()
  private isProcessing = false

  /**
   * Queue an analysis task
   * Returns the task ID for tracking
   */
  queueTask(task: Omit<AnalysisTask, 'id' | 'createdAt'>): string {
    const id = this.generateTaskId(task)

    // Prevent duplicate tasks
    if (this.tasks.has(id) || this.processedTaskIds.has(id)) {
      return id
    }

    const fullTask: AnalysisTask = {
      ...task,
      id,
      createdAt: new Date(),
    }

    this.tasks.set(id, fullTask)

    // Auto-process if not already processing
    if (!this.isProcessing) {
      this.processNextTaskAsync()
    }

    return id
  }

  /**
   * Get all pending tasks sorted by priority
   */
  getPendingTasks(): AnalysisTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => {
      // Sort by priority first
      const priorityDiff =
        PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Then by scheduled time (earlier first)
      if (a.scheduledAt && b.scheduledAt) {
        return a.scheduledAt.getTime() - b.scheduledAt.getTime()
      }

      // Then by creation time (earlier first)
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }

  /**
   * Process next task in queue
   * Returns the result or null if no tasks available
   */
  async processNextTask(): Promise<AnalysisResult | null> {
    const pendingTasks = this.getPendingTasks()

    // Find first task that's ready to process
    const now = new Date()
    const task = pendingTasks.find(
      (t) => !t.scheduledAt || t.scheduledAt <= now
    )

    if (!task) {
      return null
    }

    // Remove from queue
    this.tasks.delete(task.id)

    // Mark as processed
    this.processedTaskIds.add(task.id)

    // Process task based on type
    const result = await this.analyzeTask(task)

    // Notify subscribers
    this.notifySubscribers(result)

    return result
  }

  /**
   * Subscribe to analysis results
   * Returns unsubscribe function
   */
  onResult(callback: ResultCallback): () => void {
    this.subscribers.add(callback)

    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Clear all tasks and reset state
   */
  clear(): void {
    this.tasks.clear()
    this.processedTaskIds.clear()
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      pending: this.tasks.size,
      processed: this.processedTaskIds.size,
      subscribers: this.subscribers.size,
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Generate deterministic task ID based on type and context
   */
  private generateTaskId(
    task: Omit<AnalysisTask, 'id' | 'createdAt'>
  ): string {
    const contextStr = JSON.stringify(task.context)
    return `${task.type}-${this.hashString(contextStr)}`
  }

  /**
   * Simple string hash for deduplication
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Analyze task and generate insight
   */
  private async analyzeTask(task: AnalysisTask): Promise<AnalysisResult> {
    // Simulate AI analysis with different strategies per type
    switch (task.type) {
      case 'anomaly':
        return this.analyzeAnomaly(task)

      case 'trend':
        return this.analyzeTrend(task)

      case 'opportunity':
        return this.analyzeOpportunity(task)

      case 'recommendation':
        return this.analyzeRecommendation(task)

      default:
        throw new Error(`Unknown task type: ${task.type}`)
    }
  }

  /**
   * Analyze anomaly context
   */
  private async analyzeAnomaly(task: AnalysisTask): Promise<AnalysisResult> {
    // In production, this would call AI service
    const campaignId = task.context.campaignId as string
    const metric = task.context.metric as string
    const changePercent = task.context.changePercent as number

    const direction = changePercent > 0 ? '증가' : '감소'
    const absChange = Math.abs(changePercent).toFixed(1)

    return {
      taskId: task.id,
      type: 'anomaly',
      insight: `캠페인의 ${metric}이 평균 대비 ${absChange}% ${direction}했습니다`,
      confidence: 85,
      actionable: true,
      suggestedAction: {
        label: '상세 분석 보기',
        url: `/campaigns/${campaignId}/analytics`,
      },
      metadata: {
        campaignId,
        metric,
        changePercent,
      },
      createdAt: new Date(),
    }
  }

  /**
   * Analyze trend context
   */
  private async analyzeTrend(task: AnalysisTask): Promise<AnalysisResult> {
    const metric = task.context.metric as string
    const direction = task.context.direction as 'up' | 'down'

    return {
      taskId: task.id,
      type: 'trend',
      insight: `${metric}이 ${direction === 'up' ? '상승' : '하락'} 트렌드를 보이고 있습니다`,
      confidence: 78,
      actionable: false,
      metadata: {
        metric,
        direction,
      },
      createdAt: new Date(),
    }
  }

  /**
   * Analyze opportunity context
   */
  private async analyzeOpportunity(
    task: AnalysisTask
  ): Promise<AnalysisResult> {
    const opportunityType = task.context.opportunityType as string

    return {
      taskId: task.id,
      type: 'opportunity',
      insight: `새로운 ${opportunityType} 기회를 발견했습니다`,
      confidence: 72,
      actionable: true,
      suggestedAction: {
        label: '기회 탐색하기',
      },
      metadata: {
        opportunityType,
      },
      createdAt: new Date(),
    }
  }

  /**
   * Analyze recommendation context
   */
  private async analyzeRecommendation(
    task: AnalysisTask
  ): Promise<AnalysisResult> {
    const action = task.context.action as string

    return {
      taskId: task.id,
      type: 'recommendation',
      insight: `${action}을 권장합니다`,
      confidence: 81,
      actionable: true,
      suggestedAction: {
        label: '적용하기',
      },
      metadata: {
        action,
      },
      createdAt: new Date(),
    }
  }

  /**
   * Notify all subscribers with result
   */
  private notifySubscribers(result: AnalysisResult): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(result)
      } catch (error) {
        console.error('Error in result callback:', error)
      }
    })
  }

  /**
   * Process next task asynchronously (non-blocking)
   */
  private async processNextTaskAsync(): Promise<void> {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      while (this.tasks.size > 0) {
        await this.processNextTask()

        // Small delay to prevent blocking
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } finally {
      this.isProcessing = false
    }
  }
}
