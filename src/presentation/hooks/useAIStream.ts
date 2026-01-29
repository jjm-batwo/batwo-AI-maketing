'use client'

import { useState, useCallback, useRef } from 'react'
import type { StreamChunk } from '@application/ports/IStreamingAIService'

interface UseAIStreamOptions {
  onStart?: () => void
  onToken?: (token: string) => void
  onComplete?: (text: string) => void
  onError?: (error: Error) => void
  onProgress?: (stage: string, progress: number) => void
}

interface UseAIStreamReturn {
  /** Accumulated text from streaming */
  text: string
  /** Whether streaming is in progress */
  isLoading: boolean
  /** Error if streaming failed */
  error: Error | null
  /** Current progress stage */
  stage: string | null
  /** Progress percentage 0-100 */
  progress: number
  /** Start streaming from a URL */
  stream: (url: string, options?: RequestInit) => Promise<void>
  /** Stop the current stream */
  stop: () => void
  /** Reset state */
  reset: () => void
}

/**
 * Parse SSE (Server-Sent Events) format
 * Handles both "data: {...}" and plain text
 */
function parseSSE(line: string): StreamChunk | null {
  // Skip empty lines
  if (!line.trim()) return null

  // Handle SSE format: "data: {...}"
  if (line.startsWith('data: ')) {
    const jsonStr = line.slice(6).trim()

    // Handle SSE [DONE] signal
    if (jsonStr === '[DONE]') {
      return { type: 'done' }
    }

    try {
      return JSON.parse(jsonStr) as StreamChunk
    } catch {
      // If JSON parse fails, treat as plain text
      return { type: 'text', content: jsonStr }
    }
  }

  // Handle plain JSON without "data: " prefix
  if (line.startsWith('{')) {
    try {
      return JSON.parse(line) as StreamChunk
    } catch {
      return { type: 'text', content: line }
    }
  }

  // Fallback to plain text
  return { type: 'text', content: line }
}

export function useAIStream(options: UseAIStreamOptions = {}): UseAIStreamReturn {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [stage, setStage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)

  const stream = useCallback(async (url: string, fetchOptions?: RequestInit) => {
    // Reset state
    setText('')
    setError(null)
    setStage(null)
    setProgress(0)
    setIsLoading(true)

    // Create abort controller
    abortControllerRef.current = new AbortController()

    options.onStart?.()

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let accumulatedText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Split by newlines (SSE format)
        const lines = buffer.split('\n')

        // Keep last incomplete line in buffer
        buffer = lines.pop() || ''

        // Process each complete line
        for (const line of lines) {
          const chunk = parseSSE(line)
          if (!chunk) continue

          switch (chunk.type) {
            case 'text':
              if (chunk.content) {
                accumulatedText += chunk.content
                setText(accumulatedText)
                options.onToken?.(chunk.content)
              }
              break

            case 'progress':
              if (chunk.stage) {
                setStage(chunk.stage)
              }
              if (chunk.progress !== undefined) {
                setProgress(chunk.progress)
              }
              if (chunk.stage && chunk.progress !== undefined) {
                options.onProgress?.(chunk.stage, chunk.progress)
              }
              break

            case 'error':
              throw new Error(chunk.error || 'Stream error')

            case 'done':
              // Stream completed normally
              break
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const chunk = parseSSE(buffer)
        if (chunk?.type === 'text' && chunk.content) {
          accumulatedText += chunk.content
          setText(accumulatedText)
          options.onToken?.(chunk.content)
        }
      }

      options.onComplete?.(accumulatedText)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Cancelled - not an error
        return
      }
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options.onError?.(error)
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [options])

  const stop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    stop()
    setText('')
    setError(null)
    setStage(null)
    setProgress(0)
    setIsLoading(false)
  }, [stop])

  return { text, isLoading, error, stage, progress, stream, stop, reset }
}
