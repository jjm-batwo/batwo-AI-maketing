import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FeedbackSummaryCard } from '@presentation/components/dashboard/FeedbackSummaryCard'
import type { FeedbackAnalyticsData } from '@presentation/hooks/useFeedbackAnalytics'

const mockData: FeedbackAnalyticsData = {
  summary: {
    positive: 8,
    negative: 2,
    total: 10,
    positiveRate: 80,
  },
  trend: [
    { period: '2026-08', avgRating: 4.2, count: 15 },
  ],
  recentNegative: [
    { id: 'fb-1', comment: '불친절한 답변입니다', createdAt: new Date('2026-02-01T10:00:00Z') },
    { id: 'fb-2', comment: null, createdAt: new Date('2026-02-02T10:00:00Z') },
  ],
}

describe('FeedbackSummaryCard', () => {
  describe('로딩 상태', () => {
    it('should_render_loading_skeleton_when_isLoading_is_true', () => {
      render(<FeedbackSummaryCard isLoading />)

      const card = screen.getByTestId('feedback-summary-card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('aria-label', '피드백 요약 위젯 로딩 중')
    })
  })

  describe('데이터 없음 상태', () => {
    it('should_render_no_data_message_when_data_is_null', () => {
      render(<FeedbackSummaryCard data={null} />)

      expect(screen.getByTestId('feedback-summary-card')).toBeInTheDocument()
      expect(screen.getByText('피드백 데이터가 없습니다')).toBeInTheDocument()
    })
  })

  describe('정상 렌더링', () => {
    it('should_render_positive_rate_percentage', () => {
      render(<FeedbackSummaryCard data={mockData} />)

      const positiveRateEl = screen.getByTestId('positive-rate')
      expect(positiveRateEl).toBeInTheDocument()
      expect(positiveRateEl).toHaveTextContent('80%')
    })

    it('should_render_positive_and_negative_counts', () => {
      render(<FeedbackSummaryCard data={mockData} />)

      expect(screen.getByText(/긍정 8건/)).toBeInTheDocument()
      expect(screen.getByText(/부정 2건/)).toBeInTheDocument()
    })

    it('should_render_recent_negative_feedback_comments', () => {
      render(<FeedbackSummaryCard data={mockData} />)

      expect(screen.getByText('불친절한 답변입니다')).toBeInTheDocument()
    })

    it('should_render_fallback_text_when_comment_is_null', () => {
      render(<FeedbackSummaryCard data={mockData} />)

      expect(screen.getByText('(코멘트 없음)')).toBeInTheDocument()
    })

    it('should_render_progress_bar_with_correct_aria_attributes', () => {
      render(<FeedbackSummaryCard data={mockData} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '80')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    })

    it('should_render_card_with_feedback_summary_testid', () => {
      render(<FeedbackSummaryCard data={mockData} />)

      expect(screen.getByTestId('feedback-summary-card')).toBeInTheDocument()
    })

    it('should_show_empty_feedback_message_when_total_is_zero', () => {
      const emptyData: FeedbackAnalyticsData = {
        summary: { positive: 0, negative: 0, total: 0, positiveRate: 0 },
        trend: [],
        recentNegative: [],
      }

      render(<FeedbackSummaryCard data={emptyData} />)

      expect(screen.getByText('아직 피드백이 없습니다')).toBeInTheDocument()
    })
  })
})
