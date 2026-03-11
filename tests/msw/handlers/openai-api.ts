/**
 * TEST-10: MSW 핸들러 - OpenAI API
 *
 * OpenAI API HTTP 모킹을 MSW로 전환
 */

import { http, HttpResponse } from 'msw'

const OPENAI_API_BASE = 'https://api.openai.com/v1'

export const openAiHandlers = [
  // Chat completions (non-streaming)
  http.post(`${OPENAI_API_BASE}/chat/completions`, async ({ request }) => {
    const body = await request.json() as { stream?: boolean; messages?: Array<{ content: string }> }
    const isStreaming = body.stream === true

    if (isStreaming) {
      // SSE 스트리밍 응답
      const encoder = new TextEncoder()
      const chunks = [
        'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}\n\n',
        'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"AI 분석 결과: "},"finish_reason":null}]}\n\n',
        'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"캠페인 성과가 "},"finish_reason":null}]}\n\n',
        'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"우수합니다."},"finish_reason":null}]}\n\n',
        'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
        'data: [DONE]\n\n',
      ]

      const stream = new ReadableStream({
        start(controller) {
          chunks.forEach((chunk, i) => {
            setTimeout(() => {
              controller.enqueue(encoder.encode(chunk))
              if (i === chunks.length - 1) {
                controller.close()
              }
            }, i * 50)
          })
        },
      })

      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Non-streaming 응답
    return HttpResponse.json({
      id: 'chatcmpl-test-001',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              headline: '지금 바로 시작하세요! 특별 할인 중',
              primaryText:
                '당신의 비즈니스를 성장시킬 최고의 솔루션을 만나보세요.',
              description: '간편한 설정, 강력한 기능, 합리적인 가격',
              callToAction: '자세히 보기',
              targetAudience: '20-40대 온라인 쇼핑 관심사',
            }),
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 120,
        completion_tokens: 85,
        total_tokens: 205,
      },
    })
  }),

  // Embeddings
  http.post(`${OPENAI_API_BASE}/embeddings`, async () => {
    return HttpResponse.json({
      object: 'list',
      data: [
        {
          object: 'embedding',
          index: 0,
          embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1),
        },
      ],
      model: 'text-embedding-ada-002',
      usage: {
        prompt_tokens: 8,
        total_tokens: 8,
      },
    })
  }),

  // Error handler - rate limit
  http.post(`${OPENAI_API_BASE}/chat/completions`, async ({ request }) => {
    const headers = Object.fromEntries(request.headers.entries())

    // 잘못된 API 키 시뮬레이션
    if (headers.authorization === 'Bearer invalid_key') {
      return HttpResponse.json(
        {
          error: {
            message: 'Incorrect API key provided',
            type: 'invalid_request_error',
            code: 'invalid_api_key',
          },
        },
        { status: 401 }
      )
    }

    // 기본 응답은 위에서 처리
    return undefined as never
  }),
]
