export interface AIFeedback {
  id: string
  responseId: string
  userId: string
  rating: number
  isHelpful: boolean | null
  comment: string | null
  feature: string
  context: Record<string, unknown> | null
  responseType: 'streaming' | 'standard'
  modelUsed: string | null
  createdAt: Date
}

export interface CreateFeedbackInput {
  responseId: string
  userId: string
  rating: number
  isHelpful?: boolean
  comment?: string
  feature: string
  context?: Record<string, unknown>
  responseType: 'streaming' | 'standard'
  modelUsed?: string
}

export interface FeedbackStats {
  totalCount: number
  averageRating: number
  helpfulCount: number
  notHelpfulCount: number
}

export interface IAIFeedbackRepository {
  /**
   * Create new feedback entry
   */
  create(input: CreateFeedbackInput): Promise<{ id: string }>

  /**
   * Find feedback by user ID with optional limit
   */
  findByUserId(userId: string, limit?: number): Promise<AIFeedback[]>

  /**
   * Find feedback by feature with optional limit
   */
  findByFeature(feature: string, limit?: number): Promise<AIFeedback[]>

  /**
   * Get average rating for a specific feature
   */
  getAverageRating(feature: string): Promise<number>

  /**
   * Get feedback statistics for a feature
   */
  getFeatureStats(feature: string): Promise<FeedbackStats>

  /**
   * Get all feedback with pagination
   */
  findAll(options: {
    page: number
    limit: number
    feature?: string
    userId?: string
  }): Promise<{
    data: AIFeedback[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>

  /**
   * 긍정/부정 피드백 수를 집계한다 (rating >= 4: positive, rating <= 2: negative)
   */
  countByRating(filters?: {
    startDate?: Date
    endDate?: Date
  }): Promise<{ positive: number; negative: number; total: number }>

  /**
   * 최근 부정 피드백 목록을 조회한다
   */
  findRecentNegative(limit: number): Promise<AIFeedback[]>

  /**
   * 기간별 평균 평점 트렌드를 반환한다
   */
  getAverageRatingByPeriod(
    period: 'day' | 'week' | 'month'
  ): Promise<Array<{ period: string; avgRating: number; count: number }>>
}
