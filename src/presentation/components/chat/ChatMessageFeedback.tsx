'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useFeedback } from '@/presentation/hooks/useFeedback'

interface ChatMessageFeedbackProps {
  messageId: string
  onFeedback?: (rating: 'positive' | 'negative') => void
}

export function ChatMessageFeedback({ messageId, onFeedback }: ChatMessageFeedbackProps) {
  const { submitFeedback, isSubmitting, isSubmitted } = useFeedback()
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  // 👎 클릭 후 코멘트 제출 전까지 rating 보관
  const [pendingRating, setPendingRating] = useState<'negative' | null>(null)

  const isDisabled = isSubmitting || isSubmitted

  const handlePositive = async () => {
    onFeedback?.('positive')
    await submitFeedback({ messageId, rating: 'positive', comment: undefined })
  }

  const handleNegative = () => {
    onFeedback?.('negative')
    setPendingRating('negative')
    setShowComment(true)
  }

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await submitFeedback({
      messageId,
      rating: pendingRating ?? 'negative',
      comment: comment || undefined,
    })
    setShowComment(false)
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="flex items-center gap-1">
        <button type="button"
          data-testid="feedback-positive"
          aria-label="도움이 됐어요"
          onClick={handlePositive}
          disabled={isDisabled}
          className={cn(
            'text-sm px-2 py-1 rounded transition-colors',
            'hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          👍
        </button>
        <button type="button"
          data-testid="feedback-negative"
          aria-label="도움이 안 됐어요"
          onClick={handleNegative}
          disabled={isDisabled}
          className={cn(
            'text-sm px-2 py-1 rounded transition-colors',
            'hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          👎
        </button>
      </div>

      {showComment && !isSubmitted && (
        <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2">
          <textarea
            data-testid="feedback-comment"
            aria-label="피드백 입력"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="어떤 점이 아쉬우셨나요? (선택사항)"
            rows={2}
            className={cn(
              'resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
            )}
          />
          <button
            type="submit"
            disabled={isDisabled}
            className={cn(
              'self-end text-sm px-3 py-1 rounded-lg',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            제출
          </button>
        </form>
      )}
    </div>
  )
}
