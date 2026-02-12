import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import {
  getScienceAIService,
  getQuotaService,
  getStreamingAIService,
  getMarketingIntelligenceService,
} from '@/lib/di/container'
import { ScienceAIService } from '@infrastructure/external/openai/ScienceAIService'
import type { GenerateAdCopyInput } from '@application/ports/IAIService'
import { formatScienceContextBlock } from '@infrastructure/external/openai/prompts/science'
import {
  checkRateLimit,
  getClientIp,
  addRateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/middleware/rateLimit'

const VALID_TONES = ['professional', 'casual', 'playful', 'urgent'] as const
const VALID_OBJECTIVES = ['awareness', 'consideration', 'conversion'] as const

type Tone = (typeof VALID_TONES)[number]
type Objective = (typeof VALID_OBJECTIVES)[number]

interface ScienceCopyRequestBody {
  productName: string
  productDescription: string
  targetAudience: string
  tone: Tone
  objective: Objective
  keywords?: string[]
  variantCount?: number
}

function isValidTone(tone: string): tone is Tone {
  return VALID_TONES.includes(tone as Tone)
}

function isValidObjective(objective: string): objective is Objective {
  return VALID_OBJECTIVES.includes(objective as Objective)
}

/**
 * POST /api/ai/science-copy
 * 과학 기반 AI 광고 카피 생성
 *
 * Query Parameters:
 * - stream=true: 스트리밍 응답 활성화 (SSE)
 *
 * Body:
 * - productName: 제품명 (필수)
 * - productDescription: 제품 설명 (필수)
 * - targetAudience: 타겟 오디언스 (필수)
 * - tone: 톤 (professional, casual, playful, urgent)
 * - objective: 목표 (awareness, consideration, conversion)
 * - keywords?: 키워드 배열
 * - variantCount?: 생성할 변형 수 (기본: 3)
 *
 * Returns (non-streaming):
 * - variants: 생성된 카피 변형
 * - scienceScore: 과학 기반 신뢰도 점수
 * - knowledgeContext: 적용된 과학적 근거 컨텍스트
 * - remainingQuota: 남은 쿼터
 *
 * Returns (streaming):
 * - SSE stream with variant, progress, done, or error chunks
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  // Rate limiting for AI science copy generation
  const clientIp = getClientIp(request)
  const rateLimitKey = `${user.id}:${clientIp}`
  const rateLimitResult = await checkRateLimit(rateLimitKey, 'ai')

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  try {
    const body = (await request.json()) as ScienceCopyRequestBody

    // Validate required fields
    if (!body.productName || !body.productDescription || !body.targetAudience) {
      return NextResponse.json(
        { message: '필수 필드가 누락되었습니다 (productName, productDescription, targetAudience)' },
        { status: 400 }
      )
    }

    // Validate tone
    if (!body.tone || !isValidTone(body.tone)) {
      return NextResponse.json(
        { message: `유효하지 않은 tone입니다. 가능한 값: ${VALID_TONES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate objective
    if (!body.objective || !isValidObjective(body.objective)) {
      return NextResponse.json(
        { message: `유효하지 않은 objective입니다. 가능한 값: ${VALID_OBJECTIVES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check quota
    const quotaService = getQuotaService()
    const hasQuota = await quotaService.checkQuota(user.id, 'AI_SCIENCE')
    if (!hasQuota) {
      return NextResponse.json(
        { message: 'AI 과학 분석 쿼터가 초과되었습니다. 다음 주에 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // Check if streaming is requested
    const url = new URL(request.url)
    const shouldStream = url.searchParams.get('stream') === 'true'

    if (shouldStream) {
      // Handle streaming response
      return handleStreamingResponse(user.id, body, rateLimitResult)
    }

    // Get ScienceAIService and cast to access science-specific methods
    const scienceService = getScienceAIService() as ScienceAIService

    // Build input
    const input: GenerateAdCopyInput = {
      productName: body.productName,
      productDescription: body.productDescription,
      targetAudience: body.targetAudience,
      tone: body.tone,
      objective: body.objective,
      keywords: body.keywords,
      variantCount: body.variantCount ?? 3,
    }

    // Generate science-backed ad copy
    const result = await scienceService.generateScienceBackedAdCopy(input)

    // Log usage only on success
    await quotaService.logUsage(user.id, 'AI_SCIENCE')

    // Get remaining quota
    const status = await quotaService.getRemainingQuota(user.id)
    const remainingQuota = status.AI_SCIENCE?.remaining ?? 0

    // Build response
    const response = {
      variants: result.result,
      scienceScore: result.scienceScore,
      knowledgeContext: result.knowledgeContext,
      remainingQuota,
    }

    const jsonResponse = NextResponse.json(response)
    return addRateLimitHeaders(jsonResponse, rateLimitResult)
  } catch (error) {
    console.error('Failed to generate science-backed ad copy:', error)
    return NextResponse.json({ message: '과학 기반 카피 생성에 실패했습니다' }, { status: 500 })
  }
}

/**
 * 스트리밍 응답 처리
 */
async function handleStreamingResponse(
  userId: string,
  body: ScienceCopyRequestBody,
  rateLimitResult: { limit: number; remaining: number; reset: number }
) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Build input
        const input: GenerateAdCopyInput = {
          productName: body.productName,
          productDescription: body.productDescription,
          targetAudience: body.targetAudience,
          tone: body.tone,
          objective: body.objective,
          keywords: body.keywords,
          variantCount: body.variantCount ?? 3,
        }

        // Get marketing intelligence service to analyze and enrich input
        const intelligenceService = getMarketingIntelligenceService()
        const analysisInput = intelligenceService.mapAdCopyToAnalysisInput(input)
        const { compositeScore, knowledgeContext } = intelligenceService.analyze(analysisInput)

        // Send science score first
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'science',
              scienceScore: compositeScore,
              knowledgeContext,
            })}\n\n`
          )
        )

        // Enrich input with science context
        const enrichedInput: GenerateAdCopyInput = {
          ...input,
          scienceContext: formatScienceContextBlock(knowledgeContext),
        }

        // Stream ad copy generation
        const streamingService = getStreamingAIService()
        for await (const chunk of streamingService.streamAdCopy(enrichedInput)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
        }

        // Log usage on successful completion
        const quotaService = getQuotaService()
        await quotaService.logUsage(userId, 'AI_SCIENCE')

        // Send completion with remaining quota
        const status = await quotaService.getRemainingQuota(userId)
        const remainingQuota = status.AI_SCIENCE?.remaining ?? 0

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'quota',
              remainingQuota,
            })}\n\n`
          )
        )

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

  // Build headers with rate limit info
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
