import type { StreamChunk, AdCopyStreamChunk } from '@/application/ports/IStreamingAIService'

/**
 * SSE 스트림을 청크로 파싱
 */
export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncIterable<StreamChunk> {
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          yield { type: 'done' }
          return
        }
        try {
          const parsed = JSON.parse(data) as StreamChunk
          yield parsed
        } catch {
          yield { type: 'text', content: data }
        }
      }
    }
  }
}

/**
 * JSON 청크 스트림 파싱 (광고 카피용)
 */
export function parseAdCopyChunk(chunk: string): AdCopyStreamChunk | null {
  try {
    return JSON.parse(chunk) as AdCopyStreamChunk
  } catch {
    return null
  }
}

/**
 * ReadableStream을 AsyncIterable로 변환
 */
export async function* streamToAsyncIterable<T>(
  stream: ReadableStream<T>
): AsyncIterable<T> {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}
