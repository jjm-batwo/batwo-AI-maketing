'use client'

import { useState, useCallback, useRef } from 'react'

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolResults?: { toolName: string; data: unknown }[]
  confirmationCard?: {
    actionId: string
    toolName: string
    summary: string
    details: { label: string; value: string; changed?: boolean }[]
    warnings: string[]
    expiresAt: string
  }
  dataCards?: { cardType: string; data: unknown }[]
  suggestedQuestions?: string[]
  guideQuestion?: {
    questionId: string
    question: string
    options: { value: string; label: string; description?: string }[]
    progress: { current: number; total: number }
    answered?: boolean
    selectedValue?: string
  }
  guideRecommendation?: {
    campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
    formData: {
      objective: string
      dailyBudget: number
      campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
    }
    reasoning: string
    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  }
  isStreaming?: boolean
  timestamp: Date
}

interface UseAgentChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  conversationId: string | null
  sendMessage: (message: string) => Promise<void>
  confirmAction: (actionId: string) => Promise<void>
  cancelAction: (actionId: string) => Promise<void>
  clearMessages: () => void
}

// ============================================================================
// SSE Chunk Types (client-side mirror)
// ============================================================================

type AgentStreamChunk =
  | { type: 'text'; content: string }
  | { type: 'progress'; stage: string; progress: number }
  | { type: 'tool_call'; toolName: string; args: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; formattedMessage: string; data?: unknown }
  | {
      type: 'action_confirmation'
      actionId: string
      toolName: string
      summary: string
      details: { label: string; value: string; changed?: boolean }[]
      warnings: string[]
      expiresAt: string
    }
  | { type: 'action_result'; actionId: string; success: boolean; message: string }
  | { type: 'data_card'; cardType: string; data: unknown }
  | {
      type: 'guide_question'
      questionId: string
      question: string
      options: { value: string; label: string; description?: string }[]
      progress: { current: number; total: number }
    }
  | {
      type: 'guide_recommendation'
      recommendation: {
        campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
        formData: {
          objective: string
          dailyBudget: number
          campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
        }
        reasoning: string
        experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
      }
    }
  | { type: 'suggested_questions'; questions: string[] }
  | { type: 'error'; error: string }
  | { type: 'done' }

// ============================================================================
// Hook
// ============================================================================

export function useAgentChat(initialConversationId?: string): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  )
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (message: string) => {
      setIsLoading(true)
      setError(null)

      // 사용자 메시지 추가
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])

      // assistant placeholder
      const assistantId = `assistant-${Date.now()}`
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      try {
        abortRef.current = new AbortController()

        const response = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, conversationId }),
          signal: abortRef.current.signal,
        })

        if (!response.ok) throw new Error('Chat request failed')
        if (!response.body) throw new Error('No response body')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          const lines = text.split('\n').filter((l) => l.startsWith('data: '))

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6)) as AgentStreamChunk

              switch (data.type) {
                case 'text':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: m.content + data.content } : m
                    )
                  )
                  break

                case 'action_confirmation':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            confirmationCard: {
                              actionId: data.actionId,
                              toolName: data.toolName,
                              summary: data.summary,
                              details: data.details,
                              warnings: data.warnings,
                              expiresAt: data.expiresAt,
                            },
                          }
                        : m
                    )
                  )
                  break

                case 'data_card':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            dataCards: [
                              ...(m.dataCards ?? []),
                              { cardType: data.cardType, data: data.data },
                            ],
                          }
                        : m
                    )
                  )
                  break

                case 'tool_result':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            toolResults: [
                              ...(m.toolResults ?? []),
                              { toolName: data.toolName, data: data.data },
                            ],
                          }
                        : m
                    )
                  )
                  break

                case 'guide_question':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            guideQuestion: {
                              questionId: data.questionId,
                              question: data.question,
                              options: data.options,
                              progress: data.progress,
                            },
                          }
                        : m
                    )
                  )
                  break

                case 'guide_recommendation':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            guideRecommendation: data.recommendation,
                          }
                        : m
                    )
                  )
                  break

                case 'suggested_questions':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, suggestedQuestions: data.questions }
                        : m
                    )
                  )
                  break

                case 'done':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, isStreaming: false } : m
                    )
                  )
                  break

                case 'error':
                  setError(data.error)
                  break
              }
            } catch {
              // JSON parse error - skip malformed SSE line
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId]
  )

  const confirmAction = useCallback(async (actionId: string) => {
    const response = await fetch(`/api/agent/actions/${actionId}/confirm`, {
      method: 'POST',
    })
    const result = await response.json()

    setMessages((prev) => [
      ...prev,
      {
        id: `result-${Date.now()}`,
        role: 'assistant' as const,
        content: result.message,
        timestamp: new Date(),
      },
    ])
  }, [])

  const cancelAction = useCallback(async (actionId: string) => {
    await fetch(`/api/agent/actions/${actionId}/cancel`, { method: 'POST' })

    setMessages((prev) => [
      ...prev,
      {
        id: `cancel-${Date.now()}`,
        role: 'assistant' as const,
        content: '작업이 취소되었습니다.',
        timestamp: new Date(),
      },
    ])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    confirmAction,
    cancelAction,
    clearMessages,
  }
}
