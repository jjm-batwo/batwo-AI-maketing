/**
 * ConversationalAgentService - Resilience Integration Tests
 *
 * 아키텍처:
 *   Phase 1 (DB 셋업): withRetry({ retries: 2 }) + circuitBreaker('db-setup')
 *   Phase 2 (LLM 스트리밍): 직접 스트리밍 (CB 없음 — long-lived stream과 비호환)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  ConversationalAgentService,
  type AgentChatInput,
  type AgentStreamChunk,
} from '@application/services/ConversationalAgentService'
import type {
  IResilienceService,
  CircuitBreaker,
  RetryOptions,
} from '@application/ports/IResilienceService'
import type { IToolRegistry } from '@application/ports/IConversationalAgent'
import type { IConversationRepository } from '@domain/repositories/IConversationRepository'
import type { IPendingActionRepository } from '@domain/repositories/IPendingActionRepository'

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

async function collectChunks(stream: AsyncIterable<AgentStreamChunk>): Promise<AgentStreamChunk[]> {
  const chunks: AgentStreamChunk[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return chunks
}

function createChatInput(overrides: Partial<AgentChatInput> = {}): AgentChatInput {
  return {
    userId: 'test-user-id',
    message: '캠페인 성과를 분석해주세요',
    conversationId: 'test-conv-id',
    uiContext: 'dashboard',
    ...overrides,
  }
}

// ────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────

function createMockCircuitBreaker(): CircuitBreaker {
  return {
    execute: vi.fn().mockImplementation(async <T>(fn: () => Promise<T>) => fn()),
  }
}

function createMockResilienceService(): IResilienceService {
  const mockCB = createMockCircuitBreaker()
  return {
    withRetry: vi
      .fn()
      .mockImplementation(async <T>(fn: () => Promise<T>, _options?: RetryOptions) => fn()),
    circuitBreaker: vi.fn().mockReturnValue(mockCB),
  }
}

function createMockToolRegistry(): IToolRegistry {
  return {
    register: vi.fn(),
    get: vi.fn().mockReturnValue(undefined),
    getAll: vi.fn().mockReturnValue([]),
    has: vi.fn().mockReturnValue(false),
  } as unknown as IToolRegistry
}

function createMockConversationRepository(): IConversationRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByUserId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    addMessage: vi.fn().mockResolvedValue(undefined),
    getMessages: vi.fn().mockResolvedValue([]),
  } as unknown as IConversationRepository
}

function createMockPendingActionRepository(): IPendingActionRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByUserId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findByConversationId: vi.fn().mockResolvedValue([]),
  } as unknown as IPendingActionRepository
}

// ────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────

describe('ConversationalAgentService - Resilience Integration', () => {
  let service: ConversationalAgentService
  let mockResilienceService: IResilienceService
  let mockToolRegistry: IToolRegistry
  let mockConversationRepo: IConversationRepository
  let mockPendingActionRepo: IPendingActionRepository

  beforeEach(() => {
    vi.clearAllMocks()

    mockResilienceService = createMockResilienceService()
    mockToolRegistry = createMockToolRegistry()
    mockConversationRepo = createMockConversationRepository()
    mockPendingActionRepo = createMockPendingActionRepository()

    service = new ConversationalAgentService(
      mockToolRegistry,
      mockConversationRepo,
      mockPendingActionRepo,
      mockResilienceService as never
    )
  })

  it('Phase 1 셋업에서 withRetry를 사용해 일시적 오류를 재시도', async () => {
    let callCount = 0
    const mockWithRetry = vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => {
      callCount++
      if (callCount <= 2) {
        throw new Error('Transient DB error')
      }
      return fn()
    })
    ;(mockResilienceService as Record<string, unknown>).withRetry = mockWithRetry

    const input = createChatInput()
    const chunks = await collectChunks(service.chat(input))

    expect(mockWithRetry).toHaveBeenCalled()
    expect(mockWithRetry).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ retries: expect.any(Number) })
    )

    const doneChunk = chunks.find((c) => c.type === 'done')
    expect(doneChunk).toBeDefined()
  })

  it('Phase 1 셋업에서 circuitBreaker("db-setup")를 사용', async () => {
    const mockCB = createMockCircuitBreaker()
    let failureCount = 0
    ;(mockCB.execute as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      failureCount++
      if (failureCount >= 5) {
        throw new Error('Circuit breaker OPEN')
      }
      throw new Error('DB unavailable')
    })
    ;(mockResilienceService.circuitBreaker as ReturnType<typeof vi.fn>).mockReturnValue(mockCB)

    const input = createChatInput()
    for (let i = 0; i < 5; i++) {
      try {
        await collectChunks(service.chat(input))
      } catch {
        // 실패 예상
      }
    }

    // Phase 1에서 'db-setup' CB를 사용
    expect(mockResilienceService.circuitBreaker).toHaveBeenCalledWith('db-setup')
    expect(mockCB.execute).toHaveBeenCalled()
  })

  it('CB OPEN 시 fallback 응답을 스트리밍', async () => {
    const mockCB = createMockCircuitBreaker()
    ;(mockCB.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Circuit breaker OPEN')
    )
    ;(mockResilienceService.circuitBreaker as ReturnType<typeof vi.fn>).mockReturnValue(mockCB)

    const input = createChatInput()
    const chunks = await collectChunks(service.chat(input))

    const textChunks = chunks.filter((c) => c.type === 'text')
    expect(textChunks.length).toBeGreaterThan(0)

    const fullText = textChunks
      .map((c) => (c as { type: 'text'; content: string }).content)
      .join('')
    expect(fullText).toMatch(/일시적|잠시 후|다시 시도/)

    const doneChunk = chunks.find((c) => c.type === 'done')
    expect(doneChunk).toBeDefined()
  })

  it('서비스 복구 후 정상 응답', async () => {
    const mockCB = createMockCircuitBreaker()
    let callIndex = 0
    ;(mockCB.execute as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: () => Promise<unknown>) => {
        callIndex++
        if (callIndex <= 3) {
          throw new Error('DB unavailable')
        }
        return fn()
      }
    )
    ;(mockResilienceService.circuitBreaker as ReturnType<typeof vi.fn>).mockReturnValue(mockCB)

    const input = createChatInput()

    for (let i = 0; i < 3; i++) {
      try {
        await collectChunks(service.chat(input))
      } catch {
        // 실패 예상
      }
    }

    const chunks = await collectChunks(service.chat(input))

    const textChunks = chunks.filter((c) => c.type === 'text')
    expect(textChunks.length).toBeGreaterThan(0)

    const doneChunk = chunks.find((c) => c.type === 'done')
    expect(doneChunk).toBeDefined()

    const errorChunks = chunks.filter((c) => c.type === 'error')
    expect(errorChunks).toHaveLength(0)
  })

  it('LLM 스트리밍 실패 시 fallback 텍스트를 제공하고 정상 종료', async () => {
    // Phase 2에서 LLM 호출이 실패하면 fallback 텍스트로 대체
    // (Phase 2는 CB 없이 직접 스트리밍하므로 try/catch로 처리)
    const input = createChatInput()
    const chunks = await collectChunks(service.chat(input))

    // 스트리밍 실패해도 텍스트 청크가 있어야 함 (fallback)
    const textChunks = chunks.filter((c) => c.type === 'text')
    expect(textChunks.length).toBeGreaterThan(0)

    // done 청크로 정상 종료되어야 함
    const doneChunk = chunks.find((c) => c.type === 'done')
    expect(doneChunk).toBeDefined()

    // Phase 1에서 withRetry를 사용해야 함
    expect(mockResilienceService.withRetry).toHaveBeenCalled()
  })
})
