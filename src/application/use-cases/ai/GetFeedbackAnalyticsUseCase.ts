/**
 * GetFeedbackAnalyticsUseCase
 *
 * AI 피드백 분석 데이터를 조회한다.
 * - 긍정/부정 비율 집계
 * - 기간별 평균 평점 트렌드
 * - 최근 부정 피드백 목록
 */
import type { IAIFeedbackRepository } from '@domain/repositories/IAIFeedbackRepository'

export interface GetFeedbackAnalyticsInput {
  period?: 'day' | 'week' | 'month'
  limit?: number
}

export interface FeedbackAnalyticsResult {
  summary: {
    positive: number
    negative: number
    total: number
    positiveRate: number // 0-100
  }
  trend: Array<{ period: string; avgRating: number; count: number }>
  recentNegative: Array<{ id: string; comment: string | null; createdAt: Date }>
}

export class GetFeedbackAnalyticsUseCase {
  constructor(private readonly feedbackRepository: IAIFeedbackRepository) {}

  async execute(input: GetFeedbackAnalyticsInput = {}): Promise<FeedbackAnalyticsResult> {
    const period = input.period ?? 'week'
    const limit = input.limit ?? 5

    const [counts, trend, recentNegativeFeedback] = await Promise.all([
      this.feedbackRepository.countByRating(),
      this.feedbackRepository.getAverageRatingByPeriod(period),
      this.feedbackRepository.findRecentNegative(limit),
    ])

    const positiveRate =
      counts.total > 0 ? Math.round((counts.positive / counts.total) * 100) : 0

    return {
      summary: {
        positive: counts.positive,
        negative: counts.negative,
        total: counts.total,
        positiveRate,
      },
      trend,
      recentNegative: recentNegativeFeedback.map((f) => ({
        id: f.id,
        comment: f.comment,
        createdAt: f.createdAt,
      })),
    }
  }
}
