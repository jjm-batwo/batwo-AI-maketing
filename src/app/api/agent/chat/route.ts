import { NextRequest } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { ConversationalAgentService } from '@application/services/ConversationalAgentService'
import type { AgentStreamChunk } from '@application/services/ConversationalAgentService'

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { message, conversationId, uiContext } = body as {
      message?: string
      conversationId?: string
      uiContext?: 'dashboard' | 'campaigns' | 'reports' | 'competitors' | 'portfolio' | 'general'
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: '메시지를 입력해주세요' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: '메시지는 2000자 이내로 입력해주세요' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const agentService = container.resolve<ConversationalAgentService>(
      DI_TOKENS.ConversationalAgentService
    )

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        function sendEvent(chunk: AgentStreamChunk) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
        }

        try {
          for await (const chunk of agentService.chat({
            userId: user.id!,
            message: message.trim(),
            conversationId,
            uiContext,
          })) {
            sendEvent(chunk)
          }
        } catch (error) {
          sendEvent({
            type: 'error',
            error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
          })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
