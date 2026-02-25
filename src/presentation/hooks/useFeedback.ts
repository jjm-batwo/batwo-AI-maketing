'use client'

import { useState } from 'react'

interface SubmitFeedbackInput {
  messageId: string
  rating: 'positive' | 'negative'
  comment?: string
}

interface UseFeedbackReturn {
  submitFeedback: (input: SubmitFeedbackInput) => Promise<void>
  isSubmitting: boolean
  isSubmitted: boolean
  error: string | null
}

export function useFeedback(): UseFeedbackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitFeedback = async (input: SubmitFeedbackInput): Promise<void> => {
    setIsSubmitting(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {
        messageId: input.messageId,
        rating: input.rating,
      }
      if (input.comment !== undefined) {
        body.comment = input.comment
      }

      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          (data as { error?: string }).error ?? '피드백 제출에 실패했습니다'
        )
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submitFeedback, isSubmitting, isSubmitted, error }
}
