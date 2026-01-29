import { describe, it, expect } from 'vitest'
import {
  parseSSEStream,
  parseAdCopyChunk,
  streamToAsyncIterable
} from '@/infrastructure/external/openai/streaming/streamParser'
import type { StreamChunk, AdCopyStreamChunk } from '@/application/ports/IStreamingAIService'

describe('parseSSEStream', () => {
  it('handles SSE format', async () => {
    const chunks = [
      new TextEncoder().encode('data: {"type":"text","content":"Hello"}\n'),
      new TextEncoder().encode('data: {"type":"text","content":" World"}\n'),
      new TextEncoder().encode('data: [DONE]\n')
    ]

    const reader = createMockReader(chunks)
    const results: StreamChunk[] = []

    for await (const chunk of parseSSEStream(reader)) {
      results.push(chunk)
    }

    expect(results).toEqual([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' World' },
      { type: 'done' }
    ])
  })

  it('handles incomplete chunks (buffering)', async () => {
    const chunks = [
      new TextEncoder().encode('data: {"type":"tex'),
      new TextEncoder().encode('t","content":"Hello"}\n'),
      new TextEncoder().encode('data: [DONE]\n')
    ]

    const reader = createMockReader(chunks)
    const results: StreamChunk[] = []

    for await (const chunk of parseSSEStream(reader)) {
      results.push(chunk)
    }

    expect(results).toEqual([
      { type: 'text', content: 'Hello' },
      { type: 'done' }
    ])
  })

  it('handles [DONE] signal', async () => {
    const chunks = [
      new TextEncoder().encode('data: {"type":"text","content":"Test"}\n'),
      new TextEncoder().encode('data: [DONE]\n'),
      new TextEncoder().encode('data: {"type":"text","content":"After DONE"}\n')
    ]

    const reader = createMockReader(chunks)
    const results: StreamChunk[] = []

    for await (const chunk of parseSSEStream(reader)) {
      results.push(chunk)
    }

    expect(results).toEqual([
      { type: 'text', content: 'Test' },
      { type: 'done' }
    ])
  })

  it('handles invalid JSON as text content', async () => {
    const chunks = [
      new TextEncoder().encode('data: not valid json\n'),
      new TextEncoder().encode('data: [DONE]\n')
    ]

    const reader = createMockReader(chunks)
    const results: StreamChunk[] = []

    for await (const chunk of parseSSEStream(reader)) {
      results.push(chunk)
    }

    expect(results).toEqual([
      { type: 'text', content: 'not valid json' },
      { type: 'done' }
    ])
  })

  it('handles multiple lines in single chunk', async () => {
    const chunks = [
      new TextEncoder().encode(
        'data: {"type":"text","content":"Line1"}\ndata: {"type":"text","content":"Line2"}\n'
      ),
      new TextEncoder().encode('data: [DONE]\n')
    ]

    const reader = createMockReader(chunks)
    const results: StreamChunk[] = []

    for await (const chunk of parseSSEStream(reader)) {
      results.push(chunk)
    }

    expect(results).toEqual([
      { type: 'text', content: 'Line1' },
      { type: 'text', content: 'Line2' },
      { type: 'done' }
    ])
  })
})

describe('parseAdCopyChunk', () => {
  it('parses valid JSON', () => {
    const json = '{"type":"variant","variantIndex":0,"field":"headline","content":"Test Headline"}'
    const result = parseAdCopyChunk(json)

    expect(result).toEqual({
      type: 'variant',
      variantIndex: 0,
      field: 'headline',
      content: 'Test Headline'
    })
  })

  it('returns null for invalid JSON', () => {
    const invalid = 'not valid json'
    const result = parseAdCopyChunk(invalid)

    expect(result).toBeNull()
  })

  it('parses progress chunk', () => {
    const json = '{"type":"progress","stage":"generating"}'
    const result = parseAdCopyChunk(json)

    expect(result).toEqual({
      type: 'progress',
      stage: 'generating'
    })
  })

  it('parses done chunk', () => {
    const json = '{"type":"done"}'
    const result = parseAdCopyChunk(json)

    expect(result).toEqual({
      type: 'done'
    })
  })

  it('parses error chunk', () => {
    const json = '{"type":"error","error":"Something went wrong"}'
    const result = parseAdCopyChunk(json)

    expect(result).toEqual({
      type: 'error',
      error: 'Something went wrong'
    })
  })
})

describe('streamToAsyncIterable', () => {
  it('converts streams', async () => {
    const data = ['chunk1', 'chunk2', 'chunk3']
    const stream = new ReadableStream({
      start(controller) {
        data.forEach(chunk => controller.enqueue(chunk))
        controller.close()
      }
    })

    const results: string[] = []
    for await (const chunk of streamToAsyncIterable(stream)) {
      results.push(chunk)
    }

    expect(results).toEqual(data)
  })

  it('handles empty stream', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close()
      }
    })

    const results: unknown[] = []
    for await (const chunk of streamToAsyncIterable(stream)) {
      results.push(chunk)
    }

    expect(results).toEqual([])
  })

  it('releases lock after iteration', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test')
        controller.close()
      }
    })

    const iterator = streamToAsyncIterable(stream)
    for await (const _ of iterator) {
      // consume
    }

    // Should not throw
    expect(() => stream.getReader()).not.toThrow()
  })
})

// Helper functions
function createMockReader(chunks: Uint8Array[]): ReadableStreamDefaultReader<Uint8Array> {
  let index = 0
  return {
    read: async () => {
      if (index >= chunks.length) {
        return { done: true, value: undefined }
      }
      return { done: false, value: chunks[index++] }
    },
    releaseLock: () => {},
    cancel: async () => {},
    closed: Promise.resolve()
  } as ReadableStreamDefaultReader<Uint8Array>
}
