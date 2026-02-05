/**
 * Example usage of useAIStream hook
 * This file demonstrates how to use the useAIStream hook in a React component
 */

'use client'

import { useState } from 'react'
import { useAIStream } from './useAIStream'

export function AIStreamExample() {
  const [prompt, setPrompt] = useState('')

  const {
    text,
    isLoading,
    error,
    stage,
    progress,
    stream,
    stop,
    reset,
  } = useAIStream({
    onStart: () => console.log('Stream started'),
    onToken: (token) => console.log('Token:', token),
    onComplete: (fullText) => console.log('Stream complete:', fullText),
    onError: (err) => console.error('Stream error:', err),
    onProgress: (stage, progress) => console.log(`Progress: ${stage} ${progress}%`),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await stream('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Streaming Example</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="w-full p-2 border rounded mb-2"
          rows={4}
          disabled={isLoading}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>

          {isLoading && (
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Stop
            </button>
          )}

          <button
            type="button"
            onClick={reset}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Progress indicator */}
      {stage && (
        <div className="mb-4 p-2 bg-blue-50 rounded">
          <div className="text-sm text-blue-600 mb-1">
            {stage}: {progress}%
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          Error: {error.message}
        </div>
      )}

      {/* Streamed text output */}
      {text && (
        <div className="p-4 bg-gray-50 rounded border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <div className="whitespace-pre-wrap">{text}</div>
          {isLoading && <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />}
        </div>
      )}
    </div>
  )
}

/**
 * Usage in a page:
 *
 * import { AIStreamExample } from '@presentation/hooks/useAIStream.example'
 *
 * export default function AIPage() {
 *   return <AIStreamExample />
 * }
 */
