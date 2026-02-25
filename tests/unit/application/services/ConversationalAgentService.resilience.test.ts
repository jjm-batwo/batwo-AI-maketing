/**
 * ConversationalAgentService - Resilience Integration Tests (RED Phase)
 *
 * Test 2.3: Conversational agent resilience integration
 * These tests verify that ConversationalAgentService integrates with
 * IResilienceService (retry + circuit breaker) for fault tolerance.
 *
 * All tests FAIL because resilience integration is not yet implemented.
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

/** Collect all chunks from an async iterable into an array */
async function collectChunks(stream: AsyncIterable<AgentStreamChunk>): Promise<AgentStreamChunk[]> {
  const chunks: AgentStreamChunk[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return chunks
}

/** Create a basic AgentChatInput for testing */
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

    // RED: ConversationalAgentService does NOT accept IResilienceService yet.
    // This constructor call will fail or the service won't use resilience,
    // causing all assertions below to fail.
    service = new ConversationalAgentService(
      mockToolRegistry,
      mockConversationRepo,
      mockPendingActionRepo,
      mockResilienceService as never // Will fail - constructor doesn't accept this param
    )
  })

  // ──────────────────────────────────────────
  // Test 1: Retry on transient errors
  // ──────────────────────────────────────────
  it('should retry on transient errors using withRetry', async () => {
    // Given: withRetry가 호출될 때 재시도 후 성공하도록 설정
    let callCount = 0
    const mockWithRetry = vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => {
      callCount++
      if (callCount <= 2) {
        throw new Error('Transient LLM error')
      }
      return fn()
    })
    ;(mockResilienceService as Record<string, unknown>).withRetry = mockWithRetry

    // When: chat 요청 실행
    const input = createChatInput()
    const chunks = await collectChunks(service.chat(input))

    // Then: withRetry가 호출되어야 함
    expect(mockWithRetry).toHaveBeenCalled()
    expect(mockWithRetry).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ retries: expect.any(Number) })
    )

    // Then: 최종적으로 성공 응답이 있어야 함
    const doneChunk = chunks.find((c) => c.type === 'done')
    expect(doneChunk).toBeDefined()
  })

  // ──────────────────────────────────────────
  // Test 2: Circuit breaker opens after repeated failures
  // ──────────────────────────────────────────
  it('should open circuit breaker after repeated failures', async () => {
    // Given: circuit breaker가 반복 실패 후 OPEN 상태로 전환
    const mockCB = createMockCircuitBreaker()
    let failureCount = 0
    ;(mockCB.execute as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      failureCount++
      if (failureCount >= 5) {
        throw new Error('Circuit breaker OPEN')
      }
      throw new Error('LLM service unavailable')
    })
    ;(mockResilienceService.circuitBreaker as ReturnType<typeof vi.fn>).mockReturnValue(mockCB)

    // When: 여러 번 chat 요청을 보냄
    const input = createChatInput()
    for (let i = 0; i < 5; i++) {
      try {
        await collectChunks(service.chat(input))
      } catch {
        // 실패 예상
      }
    }

    // Then: circuitBreaker가 'llm-service' 이름으로 생성되어야 함
    expect(mockResilienceService.circuitBreaker).toHaveBeenCalledWith('llm-service')

    // Then: circuit breaker execute가 호출되어야 함
    expect(mockCB.execute).toHaveBeenCalled()
  })

  // ──────────────────────────────────────────
  // Test 3: Fallback response when circuit is open
  // ──────────────────────────────────────────
  it('should use fallback response when circuit breaker is open', async () => {
    // Given: circuit breaker가 OPEN 상태
    const mockCB = createMockCircuitBreaker()
    ;(mockCB.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Circuit breaker OPEN')
    )
    ;(mockResilienceService.circuitBreaker as ReturnType<typeof vi.fn>).mockReturnValue(mockCB)

    // When: chat 요청 실행
    const input = createChatInput()
    const chunks = await collectChunks(service.chat(input))

    // Then: 에러 대신 fallback 응답이 스트리밍 되어야 함
    const textChunks = chunks.filter((c) => c.type === 'text')
    expect(textChunks.length).toBeGreaterThan(0)

    // Then: fallback 응답에는 일시적 오류 안내 메시지가 포함되어야 함
    const fullText = textChunks
      .map((c) => (c as { type: 'text'; content: string }).content)
      .join('')
    expect(fullText).toMatch(/일시적|잠시 후|다시 시도/)

    // Then: done 청크로 정상 종료되어야 함
    const doneChunk = chunks.find((c) => c.type === 'done')
    expect(doneChunk).toBeDefined()
  })

  // ──────────────────────────────────────────
  // Test 4: Recovery when external service returns
  // ──────────────────────────────────────────
  it('should recover when external service comes back', async () => {
    // Given: circuit breaker가 HALF_OPEN 상태에서 성공하면 CLOSED로 전환
    const mockCB = createMockCircuitBreaker()
    let callIndex = 0
    ;(mockCB.execute as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: () => Promise<unknown>) => {
        callIndex++
        // 처음 3번은 실패, 이후 성공 (서비스 복구)
        if (callIndex <= 3) {
          throw new Error('LLM service unavailable')
        }
        return fn()
      }
    )
    ;(mockResilienceService.circuitBreaker as ReturnType<typeof vi.fn>).mockReturnValue(mockCB)

    // When: 실패 후 복구된 상태에서 chat 요청
    const input = createChatInput()

    // 실패 요청들
    for (let i = 0; i < 3; i++) {
      try {
        await collectChunks(service.chat(input))
      } catch {
        // 실패 예상
      }
    }

    // 복구 후 성공 요청
    const chunks = await collectChunks(service.chat(input))

    // Then: 정상 응답이 스트리밍 되어야 함
    const textChunks = chunks.filter((c) => c.type === 'text')
    expect(textChunks.length).toBeGreaterThan(0)

    // Then: done 청크로 정상 종료
    const doneChunk = chunks.find((c) => c.type === 'done')
    expect(doneChunk).toBeDefined()

    // Then: error 청크가 없어야 함 (복구 성공)
    const errorChunks = chunks.filter((c) => c.type === 'error')
    expect(errorChunks).toHaveLength(0)
  })

  // ──────────────────────────────────────────
  // Test 5: Handle streaming interruptions gracefully
  // ──────────────────────────────────────────
  it('should handle streaming interruptions gracefully', async () => {
    // Given: 스트리밍 중간에 연결이 끊기는 상황
    const mockCB = createMockCircuitBreaker()
    let streamChunkCount = 0
    ;(mockCB.execute as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: () => Promise<unknown>) => {
        streamChunkCount++
        if (streamChunkCount === 2) {
          // 두 번째 청크에서 스트리밍 중단
          throw new Error('Stream interrupted: connection reset')
        }
        return fn()
      }
    )
    ;(mockResilienceService.circuitBreaker as ReturnType<typeof vi.fn>).mockReturnValue(mockCB)

    // When: chat 스트리밍 시작
    const input = createChatInput()
    const chunks = await collectChunks(service.chat(input))

    // Then: 스트리밍 중단 시 에러 청크가 발생해야 함
    const errorChunks = chunks.filter((c) => c.type === 'error')
    expect(errorChunks.length).toBeGreaterThanOrEqual(1)

    // Then: 에러 메시지에 스트리밍 중단 관련 내용이 포함되어야 함
    const errorMsg = (errorChunks[0] as { type: 'error'; error: string }).error
    expect(errorMsg).toBeTruthy()

    // Then: done 청크로 정상 종료되어야 함 (graceful shutdown)
    const doneChunk = chunks.find((c) => c.type === 'done')
    expect(doneChunk).toBeDefined()

    // Then: withRetry를 통해 스트리밍 재시도를 시도해야 함
    expect(mockResilienceService.withRetry).toHaveBeenCalled()
  })
})
