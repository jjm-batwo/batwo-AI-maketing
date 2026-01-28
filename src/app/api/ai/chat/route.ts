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
import { prisma } from '@/lib/prisma'
import { chatSchema, validateBody } from '@/lib/validations'
import { checkRateLimit, getClientIp, addRateLimitHeaders, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

// ============================================================================
// Request/Response Types
// ============================================================================

interface ChatResponseData {
  message: string
  conversationId: string
  sources: Array<{
    type: 'campaign' | 'report' | 'anomaly'
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

    chatService = new ChatService(campaignRepo, reportRepo, kpiRepo, aiService)
  }

  return chatService
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * POST /api/ai/chat
 * Send a message to the AI chatbot
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

    // 4. ChatService 호출
    const service = getChatService()
    const response = await service.chat(
      user.id,
      body.message,
      body.conversationId
    )

    // 5. 응답
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
