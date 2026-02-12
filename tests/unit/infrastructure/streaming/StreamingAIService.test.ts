/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StreamingAIService } from '@infrastructure/external/openai/streaming/StreamingAIService'
import type { GenerateAdCopyInput } from '@application/ports/IAIService'

// Mock the 'ai' module
vi.mock('ai', () => ({
  streamText: vi.fn(),
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn((model) => model),
}))

describe('StreamingAIService', () => {
  let service: StreamingAIService

  beforeEach(() => {
    service = new StreamingAIService('gpt-4o-mini')
    vi.clearAllMocks()
  })

  describe('streamChatCompletion', () => {
    it('should yield progress, text, and done chunks', async () => {
      const { streamText } = await import('ai')

      // Mock streamText to return an async iterable
      const mockTextStream = {
        async *[Symbol.asyncIterator]() {
          yield 'Hello '
          yield 'World'
        },
      }

      vi.mocked(streamText).mockResolvedValue({
        textStream: mockTextStream,
      } as any)

      const chunks = []
      for await (const chunk of service.streamChatCompletion(
        'You are a helpful assistant',
        'Say hello'
      )) {
        chunks.push(chunk)
      }

      // Verify chunk sequence
      expect(chunks).toHaveLength(5)

      // First chunk: progress (analyzing)
      expect(chunks[0]).toEqual({
        type: 'progress',
        stage: 'analyzing',
        progress: 0,
      })

      // Second chunk: progress (generating)
      expect(chunks[1]).toEqual({
        type: 'progress',
        stage: 'generating',
        progress: 30,
      })

      // Third and fourth chunks: text
      expect(chunks[2]).toEqual({
        type: 'text',
        content: 'Hello ',
      })

      expect(chunks[3]).toEqual({
        type: 'text',
        content: 'World',
      })

      // Last chunk: done
      expect(chunks[4]).toEqual({
        type: 'done',
        progress: 100,
      })
    })

    it('should yield error chunk on failure', async () => {
      const { streamText } = await import('ai')

      // Mock streamText to throw an error
      vi.mocked(streamText).mockRejectedValue(new Error('API error'))

      const chunks = []
      for await (const chunk of service.streamChatCompletion(
        'System prompt',
        'User prompt'
      )) {
        chunks.push(chunk)
      }

      // Should have progress chunk and error chunk
      expect(chunks).toHaveLength(2)

      expect(chunks[0]).toEqual({
        type: 'progress',
        stage: 'analyzing',
        progress: 0,
      })

      expect(chunks[1]).toEqual({
        type: 'error',
        error: 'API error',
      })
    })

    it('should use custom AI config if provided', async () => {
      const { streamText } = await import('ai')

      const mockTextStream = {
        async *[Symbol.asyncIterator]() {
          yield 'Test'
        },
      }

      vi.mocked(streamText).mockResolvedValue({
        textStream: mockTextStream,
      } as any)

      const config = {
        model: 'gpt-4o',
        temperature: 0.5,
        maxTokens: 1000,
        topP: 0.9,
      }

      const chunks = []
      for await (const chunk of service.streamChatCompletion(
        'System',
        'User',
        config
      )) {
        chunks.push(chunk)
      }

      // Verify streamText was called with config
      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          temperature: 0.5,
          maxOutputTokens: 1000,
          topP: 0.9,
        })
      )
    })
  })

  describe('streamAdCopy', () => {
    it('should yield progress, variants, and done chunks', async () => {
      const { streamText } = await import('ai')

      const mockAdCopyResponse = JSON.stringify([
        {
          headline: '오늘만 50% 할인',
          primaryText: '지금 구매하면 무료배송',
          description: '한정 수량',
          callToAction: '지금 구매',
          targetAudience: '20-30대',
        },
        {
          headline: '신상품 출시',
          primaryText: '전국 최저가 보장',
          description: '품질 보증',
          callToAction: '자세히 보기',
          targetAudience: '30-40대',
        },
      ])

      const mockTextStream = {
        async *[Symbol.asyncIterator]() {
          // Yield response in chunks
          for (const char of mockAdCopyResponse) {
            yield char
          }
        },
      }

      vi.mocked(streamText).mockResolvedValue({
        textStream: mockTextStream,
      } as any)

      const input: GenerateAdCopyInput = {
        productName: '테스트 상품',
        productDescription: '테스트 설명',
        targetAudience: '20-40대',
        tone: 'professional',
        objective: 'conversion',
        variantCount: 2,
      }

      const chunks = []
      for await (const chunk of service.streamAdCopy(input)) {
        chunks.push(chunk)
      }

      // Verify chunk structure
      // Should have: 2 progress chunks + 8 variant chunks (2 variants × 4 fields) + 1 done chunk
      expect(chunks.length).toBe(11)

      // First two chunks: progress
      expect(chunks[0].type).toBe('progress')
      expect(chunks[0].stage).toBe('analyzing')

      expect(chunks[1].type).toBe('progress')
      expect(chunks[1].stage).toBe('generating')

      // Variant chunks
      expect(chunks[2]).toEqual({
        type: 'variant',
        variantIndex: 0,
        field: 'headline',
        content: '오늘만 50% 할인',
      })

      expect(chunks[3]).toEqual({
        type: 'variant',
        variantIndex: 0,
        field: 'primaryText',
        content: '지금 구매하면 무료배송',
      })

      // Last chunk: done
      expect(chunks[chunks.length - 1]).toEqual({
        type: 'done',
        stage: 'complete',
      })
    })

    it('should yield error chunk on JSON parse failure', async () => {
      const { streamText } = await import('ai')

      const mockTextStream = {
        async *[Symbol.asyncIterator]() {
          yield 'Invalid JSON'
        },
      }

      vi.mocked(streamText).mockResolvedValue({
        textStream: mockTextStream,
      } as any)

      const input: GenerateAdCopyInput = {
        productName: '테스트',
        productDescription: '테스트',
        targetAudience: '타겟',
        tone: 'casual',
        objective: 'awareness',
      }

      const chunks = []
      for await (const chunk of service.streamAdCopy(input)) {
        chunks.push(chunk)
      }

      // Should have progress chunks and error chunk
      expect(chunks.length).toBeGreaterThanOrEqual(2)
      expect(chunks[chunks.length - 1].type).toBe('error')
      expect(chunks[chunks.length - 1].error).toContain('Unexpected token')
    })

    it('should clean JSON response with code blocks', async () => {
      const { streamText } = await import('ai')

      const mockAdCopyWithCodeBlock = `\`\`\`json
[
  {
    "headline": "테스트",
    "primaryText": "테스트",
    "description": "테스트",
    "callToAction": "테스트",
    "targetAudience": "테스트"
  }
]
\`\`\``

      const mockTextStream = {
        async *[Symbol.asyncIterator]() {
          for (const char of mockAdCopyWithCodeBlock) {
            yield char
          }
        },
      }

      vi.mocked(streamText).mockResolvedValue({
        textStream: mockTextStream,
      } as any)

      const input: GenerateAdCopyInput = {
        productName: '테스트',
        productDescription: '테스트',
        targetAudience: '테스트',
        tone: 'casual',
        objective: 'awareness',
        variantCount: 1,
      }

      const chunks = []
      for await (const chunk of service.streamAdCopy(input)) {
        chunks.push(chunk)
      }

      // Should successfully parse and yield variant chunks
      const variantChunks = chunks.filter((c) => c.type === 'variant')
      expect(variantChunks.length).toBe(4) // 1 variant × 4 fields
    })
  })
})
