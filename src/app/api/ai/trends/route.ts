/**
 * 트렌드 알림 API
 *
 * GET /api/ai/trends?lookahead=14&industry=ecommerce
 * - 다가오는 마케팅 이벤트 및 기회 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { TrendAlertService } from '@/application/services/TrendAlertService'
import { checkRateLimit, getClientIp, addRateLimitHeaders, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

const trendAlertService = new TrendAlertService()

/**
 * GET /api/ai/trends
 *
 * Query params:
 * - lookahead: 조회 기간 (일) - 기본값 14
 * - industry: 업종 필터 (선택)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Rate limiting
    const clientIp = getClientIp(request)
    const rateLimitKey = `${user.id}:${clientIp}`
    const rateLimitResult = await checkRateLimit(rateLimitKey, 'ai')

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    // Query params 파싱
    const searchParams = request.nextUrl.searchParams
    const lookahead = parseInt(searchParams.get('lookahead') || '14', 10)
    const industry = searchParams.get('industry') || undefined

    // 유효성 검사
    if (lookahead < 1 || lookahead > 90) {
      return NextResponse.json({ error: 'lookahead must be between 1 and 90 days' }, { status: 400 })
    }

    const validIndustries = ['ecommerce', 'food_beverage', 'beauty', 'fashion', 'education', 'service', 'saas', 'health']
    if (industry && !validIndustries.includes(industry)) {
      return NextResponse.json(
        { error: `industry must be one of: ${validIndustries.join(', ')}` },
        { status: 400 }
      )
    }

    // 이벤트 조회
    const upcomingEvents = trendAlertService.getUpcomingEvents(lookahead, industry)

    // 주간 요약 (14일 이내만)
    let weeklyDigest = null
    if (lookahead >= 14) {
      const digest = trendAlertService.getWeeklyOpportunityDigest(user.id, industry || 'ecommerce')
      weeklyDigest = digest.weeklyDigest
    }

    const response = NextResponse.json({
      success: true,
      data: {
        upcomingEvents,
        weeklyDigest,
        lookaheadDays: lookahead,
        industry: industry || 'all',
      },
    })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('Trend alert error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trend alerts' },
      { status: 500 }
    )
  }
}
