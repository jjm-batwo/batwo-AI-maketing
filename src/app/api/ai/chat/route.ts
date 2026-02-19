/**
 * AI Chat API Endpoint
 *
 * POST /api/ai/chat
 * - RAG-based chatbot for campaign insights Q&A
 * - Conversation history management
 * - Context-aware responses
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { ChatService } from '@application/services/ChatService'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { PrismaReportRepository } from '@infrastructure/database/repositories/PrismaReportRepository'
import { PrismaKPIRepository } from '@infrastructure/database/repositories/PrismaKPIRepository'
import { AIService } from '@infrastructure/external/openai/AIService'
import { StreamingAIService } from '@infrastructure/external/openai/streaming/StreamingAIService'
import { PortfolioOptimizationService } from '@application/services/PortfolioOptimizationService'
import { prisma } from '@/lib/prisma'
import { getCompetitorTrackingRepository } from '@/lib/di/container'
import { chatSchema, validateBody } from '@/lib/validations'
import { checkRateLimit, getClientIp, addRateLimitHeaders, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

// ============================================================================
// Request/Response Types
// ============================================================================

interface ChatResponseData {
  message: string
  conversationId: string
  sources: Array<{
    type: 'campaign' | 'report' | 'anomaly' | 'competitor' | 'portfolio'
    id: string
    relevance: number
  }>
  suggestedActions?: Array<{
    action: string
    campaignId?: string
  }>
  suggestedQuestions?: string[]
}

// ============================================================================
// Service Initialization
// ============================================================================

let chatService: ChatService | null = null

function getChatService(): ChatService {
  if (!chatService) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const campaignRepo = new PrismaCampaignRepository(prisma)
    const reportRepo = new PrismaReportRepository(prisma)
    const kpiRepo = new PrismaKPIRepository(prisma)
    const aiService = new AIService(apiKey)
    const competitorTrackingRepo = getCompetitorTrackingRepository()
    const portfolioService = new PortfolioOptimizationService(campaignRepo, kpiRepo)

    chatService = new ChatService(
      campaignRepo,
      reportRepo,
      kpiRepo,
      aiService,
      competitorTrackingRepo,
      portfolioService
    )
  }

  return chatService
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/ai/chat
 * Send a message to the AI chatbot
 *
 * Query parameters:
 * - stream=true: Enable streaming response (SSE format)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Rate limiting
    const clientIp = getClientIp(req)
    const rateLimitKey = `${user.id}:${clientIp}`
    const rateLimitResult = await checkRateLimit(rateLimitKey, 'ai')

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    // 3. 요청 검증
    const validation = await validateBody(req, chatSchema)
    if (!validation.success) return validation.error

    const body = validation.data

    // 4. 스트리밍 모드 확인
    const url = new URL(req.url)
    const shouldStream = url.searchParams.get('stream') === 'true'

    if (shouldStream) {
      // 스트리밍 응답
      return handleStreamingResponse(user.id, body.message, body.conversationId, rateLimitResult)
    }

    // 5. 기존 비스트리밍 응답 (backward compatible)
    const service = getChatService()
    const response = await service.chat(
      user.id,
      body.message,
      body.conversationId
    )

    // 6. 응답
    const responseData: ChatResponseData = {
      message: response.message,
      conversationId: response.conversationId,
      sources: response.sources,
      suggestedActions: response.suggestedActions,
      suggestedQuestions: response.suggestedQuestions,
    }

    const jsonResponse = NextResponse.json(responseData)
    return addRateLimitHeaders(jsonResponse, rateLimitResult)
  } catch (error) {
    console.error('Chat API error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 스트리밍 응답 처리
 */
async function handleStreamingResponse(
  userId: string,
  message: string,
  conversationId: string | undefined,
  rateLimitResult: { limit: number; remaining: number; reset: number }
) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // StreamingAIService 초기화
        const streamingService = new StreamingAIService()
        const chatService = getChatService()

        // 컨텍스트 빌드
        const context = await chatService.buildContext(userId)

        // 시스템 프롬프트 생성 (ChatService의 private 메서드를 복제)
        const campaignSummary = context.campaigns
          .map(
            (c) =>
              `- ${c.name} (${c.status}): ROAS ${c.metrics.roas.toFixed(2)}x, 지출 ₩${c.metrics.spend.toLocaleString('ko-KR')}, 전환 ${c.metrics.conversions}개`
          )
          .join('\n')

        const anomalySummary = context.recentAnomalies
          .map(
            (a) =>
              `- ${a.campaignName}: ${a.metric} ${a.change > 0 ? '+' : ''}${a.change.toFixed(1)}x (${a.severity})`
          )
          .join('\n')

        const competitorSummary = context.trackedCompetitors.length > 0
          ? context.trackedCompetitors
              .map((c) => `- ${c.pageName}${c.industry ? ` (${c.industry})` : ''}`)
              .join('\n')
          : '- 추적 중인 경쟁사 없음'

        let portfolioInfo = '- 분석 데이터 없음'
        if (context.portfolioSummary) {
          const ps = context.portfolioSummary
          portfolioInfo = `총 예산 ₩${ps.totalBudget.toLocaleString('ko-KR')}/일, 현재 ROAS ${ps.currentTotalROAS.toFixed(2)}x → 예상 ${ps.projectedTotalROAS.toFixed(2)}x, 효율성 ${ps.efficiencyScore}/100`
        }

        const systemPrompt = `당신은 한국 디지털 마케팅 전문 AI 어시스턴트입니다. 사용자의 Meta 광고 캠페인 성과를 분석하고, 실행 가능한 조언을 제공합니다.

**현재 사용자 캠페인 현황:**
${campaignSummary || '- 활성 캠페인 없음'}

**최근 이상 징후:**
${anomalySummary || '- 특이사항 없음'}

**추적 중인 경쟁사:**
${competitorSummary}

**포트폴리오 분석:**
${portfolioInfo}

**역할 및 원칙:**
1. 사용자 데이터를 기반으로 구체적이고 맞춤화된 답변 제공
2. 실행 가능한 액션 아이템 제시 (예: "XX 캠페인 예산 30% 증액")
3. 명확하고 간결한 한국어 사용
4. 근거 있는 권장사항 제공 (ROAS, CPA 등 수치 기반)
5. 불확실한 경우 "추가 데이터가 필요합니다" 명시
6. 경쟁사 분석 및 포트폴리오 최적화 관련 질문에 컨텍스트 활용

자연스러운 텍스트로 응답하세요.`

        // 스트리밍 시작
        for await (const chunk of streamingService.streamChatCompletion(
          systemPrompt,
          message,
          { temperature: 0.6, maxTokens: 2000 }
        )) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`
          controller.enqueue(encoder.encode(data))
        }

        // 완료 신호
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        console.error('Streaming error:', error)
        const errorChunk = {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
        controller.close()
      }
    },
  })

  // Rate limit 헤더 추가
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  if (rateLimitResult) {
    headers.set('X-RateLimit-Limit', String(rateLimitResult.limit))
    headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    headers.set('X-RateLimit-Reset', String(rateLimitResult.reset))
  }

  return new Response(stream, { headers })
}

/**
 * GET /api/ai/chat?conversationId=xxx
 * Get conversation history (optional, for debugging)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = req.nextUrl.searchParams.get('conversationId')
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    const service = getChatService()
    const history = service.getConversationHistory(conversationId)

    if (!history) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ messages: history })
  } catch (error) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
