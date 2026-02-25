/**
 * ConversationSummarizerService - Unit Tests (RED Phase)
 *
 * Test 2.3: Conversation summarization service
 * Tests for summarizing conversation history with token budget management.
 *
 * All tests FAIL because ConversationSummarizerService does not exist yet.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// RED: This import will FAIL - service does not exist yet
import {
  ConversationSummarizerService,
  type Summary,
} from '@application/services/ConversationSummarizerService'
import type { IAIService } from '@application/ports/IAIService'

// ────────────────────────────────────────────
// Types (expected API for the summarizer)
// ────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

// ────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────

function createMockAIService(): IAIService {
  return {
    chatCompletion: vi.fn().mockResolvedValue('요약된 대화 내용입니다.'),
    generateAdCopy: vi.fn(),
    generateOptimization: vi.fn(),
    generateCampaignSuggestion: vi.fn(),
    generateBudgetRecommendation: vi.fn(),
    generateWeeklyReport: vi.fn(),
    generateKeywordSuggestion: vi.fn(),
    generateTargetAudience: vi.fn(),
    streamChatCompletion: vi.fn(),
  } as unknown as IAIService
}

// ────────────────────────────────────────────
// Test Data
// ────────────────────────────────────────────

function createSampleMessages(count: number): Message[] {
  const messages: Message[] = []
  for (let i = 0; i < count; i++) {
    messages.push(
      {
        role: 'user',
        content: `사용자 메시지 ${i + 1}: 캠페인 성과에 대해 알려주세요.`,
        timestamp: new Date(Date.now() - (count - i) * 60_000),
      },
      {
        role: 'assistant',
        content: `어시스턴트 응답 ${i + 1}: 현재 캠페인의 CTR은 2.5%이며, ROAS는 3.2입니다.`,
        timestamp: new Date(Date.now() - (count - i) * 60_000 + 30_000),
      }
    )
  }
  return messages
}

function createLongConversation(): Message[] {
  return [
    {
      role: 'user',
      content: '지난 주 캠페인 성과를 분석해주세요.',
      timestamp: new Date('2026-02-01'),
    },
    {
      role: 'assistant',
      content:
        '지난 주 캠페인 분석 결과입니다. CTR 2.1%, CPC 350원, ROAS 2.8배입니다. 전주 대비 CTR이 15% 개선되었습니다.',
      timestamp: new Date('2026-02-01'),
    },
    {
      role: 'user',
      content: '예산을 늘리면 어떤 효과가 있을까요?',
      timestamp: new Date('2026-02-02'),
    },
    {
      role: 'assistant',
      content:
        '예산을 30% 증가시키면 도달 범위가 약 25% 확대될 것으로 예상됩니다. 다만, CPC가 소폭 상승할 수 있습니다.',
      timestamp: new Date('2026-02-02'),
    },
    {
      role: 'user',
      content: '타겟 오디언스를 변경하고 싶어요.',
      timestamp: new Date('2026-02-03'),
    },
    {
      role: 'assistant',
      content:
        '현재 25-34세 여성 타겟에서 18-44세로 확대하시면 도달률이 40% 증가할 수 있습니다. 다만, 전환율이 다소 낮아질 수 있어요.',
      timestamp: new Date('2026-02-03'),
    },
  ]
}

// ────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────

describe('ConversationSummarizerService', () => {
  let service: ConversationSummarizerService
  let mockAIService: IAIService

  beforeEach(() => {
    vi.clearAllMocks()

    mockAIService = createMockAIService()

    // RED: ConversationSummarizerService 클래스가 존재하지 않아 실패
    service = new ConversationSummarizerService(mockAIService)
  })

  // ──────────────────────────────────────────
  // Test 1: Summarize conversation history
  // ──────────────────────────────────────────
  it('should summarize conversation history', async () => {
    // Given: 6개의 메시지가 있는 대화 히스토리
    const messages = createLongConversation()
    const expectedSummaryText =
      '사용자가 캠페인 성과 분석, 예산 증가, 타겟 오디언스 변경에 대해 논의함.'
    ;(mockAIService.chatCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(
      expectedSummaryText
    )

    // When: 대화 요약 실행
    const summary: Summary = await service.summarize(messages, 500)

    // Then: AI 서비스가 호출되어야 함
    expect(mockAIService.chatCompletion).toHaveBeenCalledTimes(1)

    // Then: 요약 결과가 반환되어야 함
    expect(summary).toBeDefined()
    expect(summary.text).toBe(expectedSummaryText)

    // Then: 요약에 원본 메시지 수가 기록되어야 함
    expect(summary.originalMessageCount).toBe(messages.length)

    // Then: 요약 생성 시간이 기록되어야 함
    expect(summary.createdAt).toBeInstanceOf(Date)
  })

  // ──────────────────────────────────────────
  // Test 2: Respect token budget limits
  // ──────────────────────────────────────────
  it('should respect token budget limits', async () => {
    // Given: 긴 대화 히스토리 (20쌍 = 40 메시지)
    const messages = createSampleMessages(20)
    const maxTokens = 200 // 엄격한 토큰 제한

    ;(mockAIService.chatCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(
      '간결한 요약입니다.'
    )

    // When: 토큰 제한을 지정하여 요약
    const summary: Summary = await service.summarize(messages, maxTokens)

    // Then: AI 서비스 호출 시 maxTokens 제한이 전달되어야 함
    expect(mockAIService.chatCompletion).toHaveBeenCalledWith(
      expect.any(String), // systemPrompt
      expect.any(String), // userPrompt
      expect.objectContaining({
        maxTokens: expect.any(Number),
      })
    )

    // Then: 요약의 예상 토큰 수가 제한 이내여야 함
    const estimatedTokens = service.estimateTokenCount(summary.text)
    expect(estimatedTokens).toBeLessThanOrEqual(maxTokens)

    // Then: 요약이 비어있지 않아야 함
    expect(summary.text.length).toBeGreaterThan(0)
  })

  // ──────────────────────────────────────────
  // Test 3: Preserve key user intents in summary
  // ──────────────────────────────────────────
  it('should preserve key user intents in summary', async () => {
    // Given: 사용자의 주요 의도가 포함된 대화
    const messages = createLongConversation()

    // AI가 주요 의도를 포함한 요약을 반환하도록 설정
    const summaryWithIntents =
      '주요 의도: 1) 캠페인 성과 분석 요청 2) 예산 증가 검토 3) 타겟 오디언스 변경 희망. ' +
      '캠페인 CTR 2.1%, ROAS 2.8배. 예산 30% 증가 시 도달 25% 확대 예상.'
    ;(mockAIService.chatCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(
      summaryWithIntents
    )

    // When: 대화 요약 실행
    const summary: Summary = await service.summarize(messages, 1000)

    // Then: AI 서비스 호출 시 시스템 프롬프트에 의도 보존 지시가 포함되어야 함
    const systemPromptArg = (mockAIService.chatCompletion as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string
    expect(systemPromptArg).toMatch(/의도|intent|key.*point/i)

    // Then: 요약에 사용자 의도 키워드가 포함되어야 함
    expect(summary.text).toMatch(/성과|분석|예산|타겟/)

    // Then: 요약에 주요 수치가 보존되어야 함
    expect(summary.keyIntents).toBeDefined()
    expect(summary.keyIntents!.length).toBeGreaterThan(0)
  })

  // ──────────────────────────────────────────
  // Test 4: Handle empty conversations
  // ──────────────────────────────────────────
  it('should handle empty conversations', async () => {
    // Given: 빈 대화 히스토리
    const messages: Message[] = []

    // When: 빈 대화에 대해 요약 실행
    const summary: Summary = await service.summarize(messages, 500)

    // Then: AI 서비스가 호출되지 않아야 함 (빈 대화는 요약 불필요)
    expect(mockAIService.chatCompletion).not.toHaveBeenCalled()

    // Then: 빈 요약이 반환되어야 함
    expect(summary).toBeDefined()
    expect(summary.text).toBe('')
    expect(summary.originalMessageCount).toBe(0)

    // Then: 빈 요약도 유효한 Summary 객체여야 함
    expect(summary.createdAt).toBeInstanceOf(Date)
  })

  // ──────────────────────────────────────────
  // Test 5: Support incremental summarization
  // ──────────────────────────────────────────
  it('should support incremental summarization', async () => {
    // Given: 이전 요약이 존재하는 상황
    const previousSummary: Summary = {
      text: '사용자가 캠페인 성과 분석을 요청함. CTR 2.1%, ROAS 2.8배.',
      originalMessageCount: 4,
      createdAt: new Date('2026-02-01'),
      keyIntents: ['캠페인 성과 분석'],
    }

    // Given: 새로운 메시지가 추가됨
    const newMessages: Message[] = [
      {
        role: 'user',
        content: '광고 소재를 A/B 테스트 해볼까요?',
        timestamp: new Date('2026-02-04'),
      },
      {
        role: 'assistant',
        content:
          '좋은 생각입니다. 현재 소재와 새로운 변형을 50:50으로 테스트하는 것을 추천드립니다.',
        timestamp: new Date('2026-02-04'),
      },
    ]

    const incrementalSummaryText =
      '사용자가 캠페인 성과 분석을 요청함. CTR 2.1%, ROAS 2.8배. ' +
      '추가로 광고 소재 A/B 테스트를 논의함. 50:50 분할 테스트 추천.'
    ;(mockAIService.chatCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(
      incrementalSummaryText
    )

    // When: 증분 요약 실행
    const summary: Summary = await service.summarizeIncrementally(previousSummary, newMessages)

    // Then: AI 서비스가 이전 요약을 컨텍스트로 전달받아야 함
    const userPromptArg = (mockAIService.chatCompletion as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as string
    expect(userPromptArg).toContain(previousSummary.text)

    // Then: 증분 요약 결과가 이전 + 새로운 내용을 포함해야 함
    expect(summary.text).toContain('A/B 테스트')
    expect(summary.text).toContain('캠페인')

    // Then: 원본 메시지 수가 누적되어야 함
    expect(summary.originalMessageCount).toBe(
      previousSummary.originalMessageCount + newMessages.length
    )

    // Then: 새 요약의 생성 시간이 이전보다 최신이어야 함
    expect(summary.createdAt.getTime()).toBeGreaterThan(previousSummary.createdAt.getTime())
  })
})
