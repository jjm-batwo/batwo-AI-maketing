import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getAIService, getQuotaService, getCopyLearningService, getStreamingAIService } from '@/lib/di/container'
import type { GenerateAdCopyInput } from '@application/ports/IAIService'
import type { Industry, CopyHookType } from '@infrastructure/external/openai/prompts/adCopyGeneration'
import { INDUSTRY_BENCHMARKS } from '@infrastructure/external/openai/prompts/adCopyGeneration'
import { checkRateLimit, getClientIp, addRateLimitHeaders, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

const VALID_TONES = ['professional', 'casual', 'playful', 'urgent'] as const
const VALID_OBJECTIVES = ['awareness', 'consideration', 'conversion'] as const
const VALID_INDUSTRIES: Industry[] = [
  'ecommerce',
  'food_beverage',
  'beauty',
  'fashion',
  'education',
  'service',
  'saas',
  'health',
]
const VALID_HOOKS: CopyHookType[] = [
  'benefit',
  'urgency',
  'social_proof',
  'curiosity',
  'fear_of_missing',
  'authority',
  'emotional',
]

type Tone = (typeof VALID_TONES)[number]
type Objective = (typeof VALID_OBJECTIVES)[number]

interface GenerateCopyRequestBody {
  productName: string
  productDescription: string
  targetAudience: string
  tone: Tone
  objective: Objective
  keywords?: string[]
  variantCount?: number
  // 향상된 옵션
  industry?: Industry
  preferredHooks?: CopyHookType[]
  includeABVariants?: boolean
  competitorContext?: string
}

function isValidTone(tone: string): tone is Tone {
  return VALID_TONES.includes(tone as Tone)
}

function isValidObjective(objective: string): objective is Objective {
  return VALID_OBJECTIVES.includes(objective as Objective)
}

function isValidIndustry(industry: string): industry is Industry {
  return VALID_INDUSTRIES.includes(industry as Industry)
}

function isValidHook(hook: string): hook is CopyHookType {
  return VALID_HOOKS.includes(hook as CopyHookType)
}

/**
 * POST /api/ai/copy
 * AI 광고 카피 생성
 *
 * Query Parameters:
 * - stream=true: 스트리밍 응답 활성화 (SSE 형식)
 *
 * Body:
 * - productName: 제품명 (필수)
 * - productDescription: 제품 설명 (필수)
 * - targetAudience: 타겟 오디언스 (필수)
 * - tone: 톤 (professional, casual, playful, urgent)
 * - objective: 목표 (awareness, consideration, conversion)
 * - keywords?: 키워드 배열
 * - variantCount?: 생성할 변형 수 (기본: 3)
 * - industry?: 업종 (ecommerce, food_beverage, beauty, fashion, education, service, saas, health)
 * - preferredHooks?: 선호하는 훅 타입 배열
 * - includeABVariants?: A/B 테스트 변형 포함 여부
 * - competitorContext?: 경쟁사 컨텍스트
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  // Rate limiting for AI copy generation
  const clientIp = getClientIp(request)
  const rateLimitKey = `${user.id}:${clientIp}`
  const rateLimitResult = await checkRateLimit(rateLimitKey, 'ai')

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  try {
    const body = (await request.json()) as GenerateCopyRequestBody

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

    // Validate industry if provided
    if (body.industry && !isValidIndustry(body.industry)) {
      return NextResponse.json(
        { message: `유효하지 않은 industry입니다. 가능한 값: ${VALID_INDUSTRIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate preferredHooks if provided
    if (body.preferredHooks) {
      const invalidHooks = body.preferredHooks.filter((h) => !isValidHook(h))
      if (invalidHooks.length > 0) {
        return NextResponse.json(
          {
            message: `유효하지 않은 hook입니다: ${invalidHooks.join(', ')}. 가능한 값: ${VALID_HOOKS.join(', ')}`,
          },
          { status: 400 }
        )
      }
    }

    // Check quota
    const quotaService = getQuotaService()
    const hasQuota = await quotaService.checkQuota(user.id, 'AI_COPY_GEN')
    if (!hasQuota) {
      return NextResponse.json(
        { message: 'AI 카피 생성 쿼터가 초과되었습니다. 내일 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // Get copy learning hints if industry is provided
    const copyLearningService = getCopyLearningService()
    let generationHints = null
    if (body.industry) {
      // 실제 구현에서는 사용자의 과거 성과 데이터를 가져와 분석
      // 현재는 벤치마크 기반 힌트만 제공
      generationHints = copyLearningService.getGenerationHints(body.industry, [], new Date())
    }

    // Prepare input
    const input: GenerateAdCopyInput = {
      productName: body.productName,
      productDescription: body.productDescription,
      targetAudience: body.targetAudience,
      tone: body.tone,
      objective: body.objective,
      keywords: body.keywords,
      variantCount: body.variantCount ?? 3,
    }

    // Check if streaming is requested
    const url = new URL(request.url)
    const shouldStream = url.searchParams.get('stream') === 'true'

    if (shouldStream) {
      // Return streaming response
      return handleStreamingCopyResponse(user.id, input, rateLimitResult, quotaService)
    }

    // Non-streaming (backward compatible)
    const aiService = getAIService()
    const variants = await aiService.generateAdCopy(input)

    // Log usage only on success
    await quotaService.logUsage(user.id, 'AI_COPY_GEN')

    // Build response
    const response: GenerateCopyResponse = {
      variants,
      remainingQuota: await getRemainingQuota(user.id, quotaService),
    }

    // Add industry insights if available
    if (body.industry) {
      const benchmark = INDUSTRY_BENCHMARKS[body.industry]
      response.industryInsights = {
        industry: body.industry,
        avgCTR: benchmark.avgCTR,
        avgCVR: benchmark.avgCVR,
        topKeywords: benchmark.topKeywords,
        bestPerformingHooks: benchmark.bestPerformingHooks,
        peakHours: benchmark.peakHours,
      }
    }

    // Add generation hints if available
    if (generationHints) {
      response.generationHints = {
        currentSeason: generationHints.currentSeason,
        isSpecialPeriod: generationHints.isSpecialPeriod,
        specialPeriodName: generationHints.specialPeriodName,
        recommendedHooks: generationHints.recommendedHooks,
        keywordSuggestions: generationHints.keywordSuggestions,
        characterGuidelines: generationHints.characterGuidelines,
        timingAdvice: generationHints.timingAdvice,
        ctaRecommendations: generationHints.ctaRecommendations,
      }
    }

    const jsonResponse = NextResponse.json(response)
    return addRateLimitHeaders(jsonResponse, rateLimitResult)
  } catch (error) {
    console.error('Failed to generate ad copy:', error)
    return NextResponse.json({ message: 'AI 카피 생성에 실패했습니다' }, { status: 500 })
  }
}

/**
 * 스트리밍 응답 처리
 */
async function handleStreamingCopyResponse(
  userId: string,
  input: GenerateAdCopyInput,
  rateLimitResult: { limit: number; remaining: number; reset: number },
  quotaService: ReturnType<typeof getQuotaService>
) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const streamingService = getStreamingAIService()

        // 스트리밍 시작
        for await (const chunk of streamingService.streamAdCopy(input)) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`
          controller.enqueue(encoder.encode(data))
        }

        // 완료 신호
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))

        // 스트리밍 성공 후 쿼터 로깅
        await quotaService.logUsage(userId, 'AI_COPY_GEN')

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
 * GET /api/ai/copy/hints
 * 카피 생성 힌트 조회
 *
 * Query Parameters:
 * - industry: 업종 (필수)
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const searchParams = request.nextUrl.searchParams
    const industry = searchParams.get('industry')

    if (!industry || !isValidIndustry(industry)) {
      return NextResponse.json(
        { message: `유효하지 않은 industry입니다. 가능한 값: ${VALID_INDUSTRIES.join(', ')}` },
        { status: 400 }
      )
    }

    const copyLearningService = getCopyLearningService()
    const hints = copyLearningService.getGenerationHints(industry, [], new Date())

    const benchmark = INDUSTRY_BENCHMARKS[industry]

    return NextResponse.json({
      industry,
      hints,
      benchmark: {
        avgCTR: benchmark.avgCTR,
        avgCVR: benchmark.avgCVR,
        topKeywords: benchmark.topKeywords,
        bestPerformingHooks: benchmark.bestPerformingHooks,
        peakHours: benchmark.peakHours,
        characterTips: benchmark.characterTips,
      },
    })
  } catch (error) {
    console.error('Failed to get copy hints:', error)
    return NextResponse.json({ message: '카피 힌트 조회에 실패했습니다' }, { status: 500 })
  }
}

// Response types
interface GenerateCopyResponse {
  variants: Array<{
    headline: string
    primaryText: string
    description: string
    callToAction: string
  }>
  remainingQuota: number
  industryInsights?: {
    industry: Industry
    avgCTR: number
    avgCVR: number
    topKeywords: string[]
    bestPerformingHooks: CopyHookType[]
    peakHours: number[]
  }
  generationHints?: {
    currentSeason: string
    isSpecialPeriod: boolean
    specialPeriodName?: string
    recommendedHooks: Array<{
      hook: CopyHookType
      reason: string
      expectedCTR: number
      confidence: number
    }>
    keywordSuggestions: string[]
    characterGuidelines: {
      headline: string
      primaryText: string
      description: string
    }
    timingAdvice: string
    ctaRecommendations: string[]
  }
}

async function getRemainingQuota(
  userId: string,
  quotaService: ReturnType<typeof getQuotaService>
): Promise<number> {
  const status = await quotaService.getRemainingQuota(userId)
  return status.AI_COPY_GEN?.remaining ?? 0
}
