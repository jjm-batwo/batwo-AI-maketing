import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getMarketingIntelligenceService, getQuotaService } from '@/lib/di/container'
import type { AnalysisInput } from '@application/ports/IKnowledgeBaseService'
import {
  checkRateLimit,
  getClientIp,
  addRateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/middleware/rateLimit'

interface ScienceAnalyzeRequestBody {
  content?: {
    headline?: string
    primaryText?: string
    description?: string
    callToAction?: string
    brand?: string
  }
  context?: {
    industry?: string
    targetAudience?: string
    objective?: 'awareness' | 'consideration' | 'conversion'
    tone?: 'professional' | 'casual' | 'playful' | 'urgent'
    keywords?: string[]
  }
  metrics?: {
    ctr?: number
    cvr?: number
    roas?: number
    cpa?: number
    frequency?: number
  }
  creative?: {
    format?: 'image' | 'video' | 'carousel'
    dominantColors?: string[]
    hasVideo?: boolean
    videoDuration?: number
  }
  includeResearch?: boolean
}

/**
 * POST /api/ai/science-analyze
 * 전체 마케팅 인텔리전스 분석 (과학적 근거 + 선택적 리서치)
 *
 * Body:
 * - content?: 콘텐츠 정보 (headline, primaryText, description, callToAction, brand)
 * - context?: 컨텍스트 정보 (industry, targetAudience, objective, tone, keywords)
 * - metrics?: 성과 지표 (ctr, cvr, roas, cpa, frequency)
 * - creative?: 크리에이티브 정보 (format, dominantColors, hasVideo, videoDuration)
 * - includeResearch?: 실시간 리서치 포함 여부 (Phase 3 Perplexity 통합)
 *
 * Note: 최소 하나 이상의 섹션이 제공되어야 합니다.
 * Note: AI_SCIENCE 쿼터 사용 (10/week)
 *
 * Returns:
 * - compositeScore: 종합 과학 점수
 * - knowledgeContext: 적용된 과학적 근거
 * - researchFindings?: 리서치 결과 (includeResearch=true인 경우)
 * - remainingQuota: 남은 쿼터
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  // Rate limiting for AI analysis
  const clientIp = getClientIp(request)
  const rateLimitKey = `${user.id}:${clientIp}`
  const rateLimitResult = await checkRateLimit(rateLimitKey, 'ai')

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  try {
    const body = (await request.json()) as ScienceAnalyzeRequestBody

    // Validate: at least one section must be provided
    if (!body.content && !body.context && !body.metrics && !body.creative) {
      return NextResponse.json(
        {
          message:
            '최소 하나 이상의 분석 데이터가 필요합니다 (content, context, metrics, creative 중 하나)',
        },
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

    // Build analysis input
    const input: AnalysisInput = {
      content: body.content,
      context: body.context,
      metrics: body.metrics,
      creative: body.creative,
    }

    // Get MarketingIntelligenceService and analyze
    const intelligence = getMarketingIntelligenceService()

    let compositeScore
    let knowledgeContext
    let researchFindings

    if (body.includeResearch) {
      // Phase 3: Use analyzeWithResearch (async, includes Perplexity research)
      const resultWithResearch = await intelligence.analyzeWithResearch(input)
      compositeScore = resultWithResearch.compositeScore
      knowledgeContext = resultWithResearch.knowledgeContext
      researchFindings = resultWithResearch.researchFindings
    } else {
      // Standard analysis (sync, knowledge base only)
      const result = intelligence.analyze(input)
      compositeScore = result.compositeScore
      knowledgeContext = result.knowledgeContext
      researchFindings = undefined
    }

    // Log usage only on success
    await quotaService.logUsage(user.id, 'AI_SCIENCE')

    // Get remaining quota
    const status = await quotaService.getRemainingQuota(user.id)
    const remainingQuota = status.AI_SCIENCE?.remaining ?? 0

    // Build response
    const response = {
      compositeScore,
      knowledgeContext,
      researchFindings: body.includeResearch ? researchFindings : undefined,
      remainingQuota,
    }

    const jsonResponse = NextResponse.json(response)
    return addRateLimitHeaders(jsonResponse, rateLimitResult)
  } catch (error) {
    console.error('Failed to perform science analysis:', error)
    return NextResponse.json({ message: '과학 분석에 실패했습니다' }, { status: 500 })
  }
}
