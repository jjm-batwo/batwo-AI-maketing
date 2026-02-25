import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetFeedbackAnalyticsUseCase } from '@application/use-cases/ai/GetFeedbackAnalyticsUseCase'
import type { IAIFeedbackRepository, AIFeedback } from '@domain/repositories/IAIFeedbackRepository'

function makeMockFeedback(overrides: Partial<AIFeedback> = {}): AIFeedback {
  return {
    id: 'fb-1',
    responseId: 'res-1',
    userId: 'user-1',
    rating: 1,
    isHelpful: false,
    comment: '도움이 안됐어요',
    feature: 'chat',
    context: null,
    responseType: 'streaming',
    modelUsed: null,
    createdAt: new Date('2026-02-01T10:00:00Z'),
    ...overrides,
  }
}

function makeMockRepository(): IAIFeedbackRepository {
  return {
    create: vi.fn(),
    findByUserId: vi.fn(),
    findByFeature: vi.fn(),
    getAverageRating: vi.fn(),
    getFeatureStats: vi.fn(),
    findAll: vi.fn(),
    countByRating: vi.fn().mockResolvedValue({ positive: 8, negative: 2, total: 10 }),
    findRecentNegative: vi.fn().mockResolvedValue([
      makeMockFeedback({ id: 'fb-1', comment: '불친절한 답변', rating: 1 }),
      makeMockFeedback({ id: 'fb-2', comment: '이해하기 어려워요', rating: 2 }),
    ]),
    getAverageRatingByPeriod: vi.fn().mockResolvedValue([
      { period: '2026-08', avgRating: 4.2, count: 15 },
      { period: '2026-07', avgRating: 3.8, count: 12 },
    ]),
  }
}

describe('GetFeedbackAnalyticsUseCase', () => {
  let repository: IAIFeedbackRepository
  let useCase: GetFeedbackAnalyticsUseCase

  beforeEach(() => {
    repository = makeMockRepository()
    useCase = new GetFeedbackAnalyticsUseCase(repository)
  })

  describe('execute', () => {
    it('should_return_correct_summary_with_positive_rate', async () => {
      const result = await useCase.execute({ period: 'week', limit: 5 })

      expect(result.summary.positive).toBe(8)
      expect(result.summary.negative).toBe(2)
      expect(result.summary.total).toBe(10)
      expect(result.summary.positiveRate).toBe(80)
    })

    it('should_return_trend_data_from_repository', async () => {
      const result = await useCase.execute({ period: 'month' })

      expect(result.trend).toHaveLength(2)
      expect(result.trend[0].period).toBe('2026-08')
      expect(result.trend[0].avgRating).toBe(4.2)
      expect(result.trend[0].count).toBe(15)
    })

    it('should_return_recent_negative_feedback_list', async () => {
      const result = await useCase.execute({ limit: 2 })

      expect(result.recentNegative).toHaveLength(2)
      expect(result.recentNegative[0].id).toBe('fb-1')
      expect(result.recentNegative[0].comment).toBe('불친절한 답변')
      expect(result.recentNegative[0].createdAt).toBeInstanceOf(Date)
    })

    it('should_use_default_period_week_when_not_specified', async () => {
      await useCase.execute()

      expect(repository.getAverageRatingByPeriod).toHaveBeenCalledWith('week')
    })

    it('should_use_default_limit_5_when_not_specified', async () => {
      await useCase.execute()

      expect(repository.findRecentNegative).toHaveBeenCalledWith(5)
    })

    it('should_return_zero_positive_rate_when_total_is_zero', async () => {
      vi.mocked(repository.countByRating).mockResolvedValue({
        positive: 0,
        negative: 0,
        total: 0,
      })

      const result = await useCase.execute()

      expect(result.summary.positiveRate).toBe(0)
    })

    it('should_call_all_three_repository_methods', async () => {
      await useCase.execute({ period: 'day', limit: 3 })

      expect(repository.countByRating).toHaveBeenCalledTimes(1)
      expect(repository.findRecentNegative).toHaveBeenCalledWith(3)
      expect(repository.getAverageRatingByPeriod).toHaveBeenCalledWith('day')
    })

    it('should_map_recentNegative_to_id_comment_createdAt_only', async () => {
      const result = await useCase.execute()

      const item = result.recentNegative[0]
      expect(Object.keys(item)).toEqual(['id', 'comment', 'createdAt'])
    })
  })
})
