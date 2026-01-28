/**
 * 경쟁사 광고 분석 API 엔드포인트
 *
 * GET /api/ai/competitors?keywords=skincare&countries=KR
 * - 키워드로 경쟁사 광고 검색 및 분석
 *
 * POST /api/ai/competitors
 * - 특정 경쟁사 페이지 추적 저장 (향후 확장)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { CompetitorAnalysisService } from '@application/services/CompetitorAnalysisService'
import { AdLibraryClient } from '@infrastructure/external/meta-ads/AdLibraryClient'
import { AIService } from '@infrastructure/external/openai/AIService'
import { competitorsQuerySchema, competitorsTrackingSchema, validateQuery, validateBody } from '@/lib/validations'
import { checkRateLimit, getClientIp, addRateLimitHeaders, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

/**
 * GET /api/ai/competitors
 *
 * Query params:
 * - keywords: string (comma-separated)
 * - countries: string (comma-separated, default: KR)
 * - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // 2. Rate limiting
    const clientIp = getClientIp(request)
    const rateLimitKey = `${user.id}:${clientIp}`
    const rateLimitResult = await checkRateLimit(rateLimitKey, 'ai')

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    // 3. Query params 검증
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(searchParams, competitorsQuerySchema)
    if (!validation.success) return validation.error

    const { keywords: keywordsParam, countries: countriesParam, limit } = validation.data

    const keywords = keywordsParam.split(',').map((k) => k.trim())
    const countries = countriesParam.split(',').map((c) => c.trim())

    // 3. Meta Access Token 조회
    // FUTURE: 프로덕션에서는 prisma.metaAdAccount에서 사용자별 토큰 조회
    // 현재는 개발 편의상 환경변수 사용
    const accessToken = process.env.META_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Meta connection not found. Please connect your Meta account first.',
        },
        { status: 400 }
      )
    }

    // 4. 서비스 초기화
    const adLibraryClient = new AdLibraryClient()
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }
    const aiService = new AIService(openaiApiKey)
    const competitorAnalysisService = new CompetitorAnalysisService(
      adLibraryClient,
      aiService
    )

    // 5. 경쟁사 광고 검색
    const ads = await competitorAnalysisService.searchCompetitorAds(accessToken, {
      keywords,
      countries,
      limit,
    })

    // 6. 분석 실행
    const analysis = await competitorAnalysisService.analyzeCompetitorCreatives({
      ads,
      industry: validation.data.industry,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        totalAds: ads.length,
        analysis,
      },
    })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('[API] /api/ai/competitors GET error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
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
 * POST /api/ai/competitors
 *
 * Body:
 * - pageIds: string[] (경쟁사 페이지 ID 추적 저장)
 * - industry: string (선택)
 *
 * 향후 확장: 사용자가 추적하고 싶은 경쟁사 페이지를 저장하고
 * 주기적으로 새 광고를 모니터링하는 기능
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // 2. Body 검증
    const validation = await validateBody(request, competitorsTrackingSchema)
    if (!validation.success) return validation.error

    const { pageIds } = validation.data

    // FUTURE: 경쟁사 추적 기능 구현 (CompetitorTracking 모델 추가 필요)
    // - 사용자가 선택한 경쟁사 페이지를 DB에 저장
    // - 주기적으로 새 광고를 크롤링하여 알림 발송
    // - 경쟁사 트렌드 분석 대시보드 제공

    return NextResponse.json({
      success: true,
      message: `Tracking ${pageIds.length} competitor pages. (Feature coming soon)`,
    })
  } catch (error) {
    console.error('[API] /api/ai/competitors POST error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
