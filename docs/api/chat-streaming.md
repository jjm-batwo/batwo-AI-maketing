# Chat Streaming API Documentation

## Overview

The `/api/ai/chat` endpoint now supports streaming responses using Server-Sent Events (SSE) format. This allows for real-time AI responses with progress updates.

## Endpoint

```
POST /api/ai/chat
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `stream` | boolean | `false` | Enable streaming response (SSE format) |

## Request Body

```typescript
{
  "message": string,        // User message
  "conversationId"?: string // Optional conversation ID for context
}
```

## Response Formats

### Non-Streaming Response (Default)

**Content-Type:** `application/json`

```json
{
  "message": "AI response text",
  "conversationId": "conv_123456_abc",
  "sources": [
    {
      "type": "campaign",
      "id": "campaign-id",
      "relevance": 1.0
    }
  ],
  "suggestedActions": [
    {
      "action": "Increase budget by 30%",
      "campaignId": "campaign-id"
    }
  ],
  "suggestedQuestions": [
    "How can I improve ROAS?",
    "Which campaign should I pause?"
  ]
}
```

### Streaming Response (`?stream=true`)

**Content-Type:** `text/event-stream`

**Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1234567890
```

**Stream Format:**

Each chunk is sent in SSE format:
```
data: <JSON chunk>

```

**Chunk Types:**

#### 1. Progress Chunk
```json
{
  "type": "progress",
  "stage": "analyzing" | "generating" | "optimizing",
  "progress": 0-100
}
```

#### 2. Text Chunk
```json
{
  "type": "text",
  "content": "partial response text"
}
```

#### 3. Done Chunk
```json
{
  "type": "done",
  "progress": 100
}
```

#### 4. Error Chunk
```json
{
  "type": "error",
  "error": "error message"
}
```

#### 5. Completion Signal
```
data: [DONE]
```

## Example Usage

### Non-Streaming (Backward Compatible)

```typescript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'How can I improve my ROAS?',
    conversationId: 'conv_123456_abc'
  })
})

const data = await response.json()
console.log(data.message)
```

### Streaming

```typescript
const response = await fetch('/api/ai/chat?stream=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'How can I improve my ROAS?',
    conversationId: 'conv_123456_abc'
  })
})

const reader = response.body?.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  const lines = chunk.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6)

      if (data === '[DONE]') {
        console.log('Stream complete')
        break
      }

      try {
        const json = JSON.parse(data)

        switch (json.type) {
          case 'progress':
            console.log(`Progress: ${json.stage} ${json.progress}%`)
            break
          case 'text':
            console.log(`Text: ${json.content}`)
            // Append to UI
            break
          case 'done':
            console.log('Response complete')
            break
          case 'error':
            console.error(`Error: ${json.error}`)
            break
        }
      } catch (e) {
        console.error('Failed to parse chunk:', e)
      }
    }
  }
}
```

### Using EventSource (Browser)

```typescript
// Note: EventSource doesn't support POST, so this requires a proxy or alternative approach
// For POST with streaming, use fetch() as shown above

// Example with GET (if endpoint supported GET):
const eventSource = new EventSource('/api/ai/chat?stream=true&message=Hello')

eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close()
    return
  }

  try {
    const chunk = JSON.parse(event.data)
    console.log('Received chunk:', chunk)
  } catch (e) {
    console.error('Failed to parse:', e)
  }
}

eventSource.onerror = (error) => {
  console.error('EventSource error:', error)
  eventSource.close()
}
```

## React Example

```typescript
import { useState, useEffect } from 'react'

export function ChatWithStreaming() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    setIsLoading(true)
    setResponse('')
    setProgress(0)

    const res = await fetch('/api/ai/chat?stream=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            setIsLoading(false)
            break
          }

          try {
            const json = JSON.parse(data)

            if (json.type === 'progress') {
              setProgress(json.progress || 0)
            } else if (json.type === 'text') {
              setResponse(prev => prev + json.content)
            } else if (json.type === 'done') {
              setProgress(100)
            } else if (json.type === 'error') {
              console.error(json.error)
              setIsLoading(false)
            }
          } catch (e) {
            console.error('Parse error:', e)
          }
        }
      }
    }
  }

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask a question..."
      />
      <button onClick={sendMessage} disabled={isLoading}>
        Send
      </button>

      {isLoading && <div>Progress: {progress}%</div>}

      <div className="response">
        {response}
      </div>
    </div>
  )
}
```

## Rate Limiting

Both streaming and non-streaming modes respect the same rate limits:
- Limit: 20 requests per minute (configurable)
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Error Handling

### Non-Streaming Errors

```json
{
  "error": "Error message"
}
```

HTTP Status Codes:
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Internal server error

### Streaming Errors

Errors during streaming are sent as error chunks:

```json
{
  "type": "error",
  "error": "Error message"
}
```

The stream will close after an error chunk is sent.

## Authentication

All requests require authentication via session cookie or Bearer token.

## Performance Considerations

- **Streaming**: Better for long responses, provides immediate feedback
- **Non-streaming**: Better for short responses, simpler client implementation
- **Buffering**: Client should handle partial chunks and reassemble messages

## Backward Compatibility

The endpoint maintains full backward compatibility:
- Default behavior (no `stream` parameter) returns JSON response
- Existing clients continue to work without changes
- New clients can opt-in to streaming with `?stream=true`

## Migration Guide

To migrate from non-streaming to streaming:

1. Add `?stream=true` to the request URL
2. Change response handling from `await response.json()` to stream reading
3. Handle chunk types: `progress`, `text`, `done`, `error`
4. Update UI to show incremental responses
5. Handle the `[DONE]` signal to close the stream

## See Also

- [ChatService Documentation](../services/ChatService.md)
- [StreamingAIService Documentation](../services/StreamingAIService.md)
- [Rate Limiting Documentation](../middleware/rate-limiting.md)
