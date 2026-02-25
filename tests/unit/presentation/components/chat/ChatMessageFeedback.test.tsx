import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatMessageFeedback } from '@/presentation/components/chat/ChatMessageFeedback'

// useFeedback 모킹
vi.mock('@/presentation/hooks/useFeedback', () => ({
  useFeedback: vi.fn(),
}))

import { useFeedback } from '@/presentation/hooks/useFeedback'

const mockUseFeedback = vi.mocked(useFeedback)

describe('ChatMessageFeedback', () => {
  const defaultProps = {
    messageId: 'msg-001',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFeedback.mockReturnValue({
      submitFeedback: vi.fn(),
      isSubmitting: false,
      isSubmitted: false,
      error: null,
    })
  })

  describe('초기 렌더링', () => {
    it('should_render_positive_and_negative_buttons', () => {
      render(<ChatMessageFeedback {...defaultProps} />)

      expect(screen.getByTestId('feedback-positive')).toBeInTheDocument()
      expect(screen.getByTestId('feedback-negative')).toBeInTheDocument()
    })

    it('should_have_correct_aria_labels_for_accessibility', () => {
      render(<ChatMessageFeedback {...defaultProps} />)

      expect(screen.getByTestId('feedback-positive')).toHaveAttribute(
        'aria-label',
        '도움이 됐어요'
      )
      expect(screen.getByTestId('feedback-negative')).toHaveAttribute(
        'aria-label',
        '도움이 안 됐어요'
      )
    })

    it('should_not_show_comment_form_initially', () => {
      render(<ChatMessageFeedback {...defaultProps} />)

      expect(screen.queryByTestId('feedback-comment')).not.toBeInTheDocument()
    })
  })

  describe('부정적 피드백 클릭 시', () => {
    it('should_show_comment_input_when_negative_button_clicked', async () => {
      const user = userEvent.setup()
      render(<ChatMessageFeedback {...defaultProps} />)

      await user.click(screen.getByTestId('feedback-negative'))

      expect(screen.getByTestId('feedback-comment')).toBeInTheDocument()
    })

    it('should_call_onFeedback_with_negative_rating_when_negative_clicked', async () => {
      const onFeedback = vi.fn()
      const user = userEvent.setup()
      render(<ChatMessageFeedback {...defaultProps} onFeedback={onFeedback} />)

      await user.click(screen.getByTestId('feedback-negative'))

      expect(onFeedback).toHaveBeenCalledWith('negative')
    })
  })

  describe('긍정적 피드백 클릭 시', () => {
    it('should_call_submitFeedback_when_positive_button_clicked', async () => {
      const mockSubmit = vi.fn()
      mockUseFeedback.mockReturnValue({
        submitFeedback: mockSubmit,
        isSubmitting: false,
        isSubmitted: false,
        error: null,
      })
      const user = userEvent.setup()
      render(<ChatMessageFeedback {...defaultProps} />)

      await user.click(screen.getByTestId('feedback-positive'))

      expect(mockSubmit).toHaveBeenCalledWith({
        messageId: 'msg-001',
        rating: 'positive',
        comment: undefined,
      })
    })

    it('should_call_onFeedback_with_positive_rating_when_positive_clicked', async () => {
      const onFeedback = vi.fn()
      const user = userEvent.setup()
      render(<ChatMessageFeedback {...defaultProps} onFeedback={onFeedback} />)

      await user.click(screen.getByTestId('feedback-positive'))

      expect(onFeedback).toHaveBeenCalledWith('positive')
    })
  })

  describe('피드백 제출 후', () => {
    it('should_disable_buttons_after_submission', () => {
      mockUseFeedback.mockReturnValue({
        submitFeedback: vi.fn(),
        isSubmitting: false,
        isSubmitted: true,
        error: null,
      })
      render(<ChatMessageFeedback {...defaultProps} />)

      expect(screen.getByTestId('feedback-positive')).toBeDisabled()
      expect(screen.getByTestId('feedback-negative')).toBeDisabled()
    })

    it('should_disable_buttons_while_submitting', () => {
      mockUseFeedback.mockReturnValue({
        submitFeedback: vi.fn(),
        isSubmitting: true,
        isSubmitted: false,
        error: null,
      })
      render(<ChatMessageFeedback {...defaultProps} />)

      expect(screen.getByTestId('feedback-positive')).toBeDisabled()
      expect(screen.getByTestId('feedback-negative')).toBeDisabled()
    })
  })

  describe('코멘트 제출', () => {
    it('should_submit_feedback_with_comment_when_form_submitted', async () => {
      const mockSubmit = vi.fn()
      mockUseFeedback.mockReturnValue({
        submitFeedback: mockSubmit,
        isSubmitting: false,
        isSubmitted: false,
        error: null,
      })
      const user = userEvent.setup()
      render(<ChatMessageFeedback {...defaultProps} />)

      // 👎 클릭해서 코멘트 폼 표시
      await user.click(screen.getByTestId('feedback-negative'))
      const commentInput = screen.getByTestId('feedback-comment')
      await user.type(commentInput, '응답이 부정확합니다')

      // 폼 제출 (Enter 또는 제출 버튼)
      fireEvent.submit(commentInput.closest('form')!)

      expect(mockSubmit).toHaveBeenCalledWith({
        messageId: 'msg-001',
        rating: 'negative',
        comment: '응답이 부정확합니다',
      })
    })
  })
})
