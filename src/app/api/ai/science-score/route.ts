import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getMarketingIntelligenceService } from '@/lib/di/container'
import type { AnalysisInput } from '@application/ports/IKnowledgeBaseService'
import {
  checkRateLimit,
  getClientIp,
  addRateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/middleware/rateLimit'

interface ScienceScoreRequestBody {
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
}

/**
 * POST /api/ai/science-score
 * 마케팅 콘텐츠 과학 분석 점수 생성
 *
 * Body:
 * - content?: 콘텐츠 정보 (headline, primaryText, description, callToAction, brand)
 * - context?: 컨텍스트 정보 (industry, targetAudience, objective, tone, keywords)
 * - metrics?: 성과 지표 (ctr, cvr, roas, cpa, frequency)
 * - creative?: 크리에이티브 정보 (format, dominantColors, hasVideo, videoDuration)
 *
 * Note: 최소 하나 이상의 섹션이 제공되어야 합니다.
 * Note: 무료 엔드포인트이므로 쿼터 체크 없음 (rate limit만 적용)
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
    const body = (await request.json()) as ScienceScoreRequestBody

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

    // Build analysis input
    const input: AnalysisInput = {
      content: body.content,
      context: body.context,
      metrics: body.metrics,
      creative: body.creative,
    }

    // Get MarketingIntelligenceService and analyze
    const intelligence = getMarketingIntelligenceService()
    const { compositeScore } = intelligence.analyze(input)

    const jsonResponse = NextResponse.json({
      score: compositeScore,
    })

    return addRateLimitHeaders(jsonResponse, rateLimitResult)
  } catch (error) {
    console.error('Failed to generate science score:', error)
    return NextResponse.json({ message: '과학 분석에 실패했습니다' }, { status: 500 })
  }
}
