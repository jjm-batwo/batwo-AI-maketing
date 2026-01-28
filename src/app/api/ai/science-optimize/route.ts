import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getScienceAIService, getQuotaService } from '@/lib/di/container'
import { ScienceAIService } from '@infrastructure/external/openai/ScienceAIService'
import type { GenerateOptimizationInput } from '@application/ports/IAIService'
import {
  checkRateLimit,
  getClientIp,
  addRateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/middleware/rateLimit'

interface ScienceOptimizeRequestBody {
  campaignName: string;
  objective: string;
  industry?: string;
  currentMetrics: {
    ctr: number;
    cvr: number;
    roas: number;
    cpa: number;
    impressions?: number;
    clicks?: number;
    spend?: number;
  };
  targetAudience?: {
    ageRange?: string;
    gender?: string;
    interests?: string[];
    location?: string;
  };
  budget?: {
    daily: number;
    total?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse()
    }

    // 2. Rate limit check
    const clientIp = getClientIp(request)
    const rateLimitResult = await checkRateLimit(`${user.id}:${clientIp}`, 'ai')

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    // 3. Validate request body
    const body: ScienceOptimizeRequestBody = await request.json()

    if (!body.campaignName || !body.objective || !body.currentMetrics) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. campaignName, objective, currentMetrics를 제공해주세요.' },
        { status: 400 }
      )
    }

    const { ctr, cvr, roas, cpa } = body.currentMetrics;
    if (
      typeof ctr !== 'number' ||
      typeof cvr !== 'number' ||
      typeof roas !== 'number' ||
      typeof cpa !== 'number'
    ) {
      return NextResponse.json(
        { error: 'currentMetrics에 ctr, cvr, roas, cpa 값이 필요합니다.' },
        { status: 400 }
      )
    }

    // 4. Check AI_SCIENCE quota
    const quotaService = getQuotaService()
    const quotaCheck = await quotaService.checkQuota(user.id, 'AI_SCIENCE')

    if (!quotaCheck) {
      return NextResponse.json(
        { error: 'AI 과학 분석 쿼터가 초과되었습니다. 다음 주에 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // 5. Get ScienceAIService
    const scienceService = getScienceAIService() as ScienceAIService

    // 6. Build GenerateOptimizationInput
    const input: GenerateOptimizationInput = {
      campaignName: body.campaignName,
      objective: body.objective,
      industry: body.industry as 'ecommerce' | 'food_beverage' | 'beauty' | 'fashion' | 'education' | 'service' | 'saas' | 'health' | undefined,
      currentMetrics: {
        ctr: body.currentMetrics.ctr,
        cvr: body.currentMetrics.cvr,
        roas: body.currentMetrics.roas,
        cpa: body.currentMetrics.cpa,
        impressions: body.currentMetrics.impressions ?? 0,
        clicks: body.currentMetrics.clicks ?? 0,
        spend: body.currentMetrics.spend ?? 0,
        conversions: 0,
      },
      targetAudience: body.targetAudience,
    };

    // 7. Call generateScienceBackedOptimization
    const result = await scienceService.generateScienceBackedOptimization(input);

    // 8. Log usage
    await quotaService.logUsage(user.id, 'AI_SCIENCE')

    // 9. Return result with remaining quota
    const status = await quotaService.getRemainingQuota(user.id)

    const jsonResponse = NextResponse.json({
      suggestions: result.result,
      scienceScore: result.scienceScore,
      knowledgeContext: result.knowledgeContext,
      remainingQuota: status.AI_SCIENCE?.remaining ?? 0,
    })

    // Add rate limit headers
    return addRateLimitHeaders(jsonResponse, rateLimitResult)
  } catch (error) {
    console.error('[AI Science Optimize Error]', error)
    return NextResponse.json(
      { error: '과학 기반 최적화 분석에 실패했습니다' },
      { status: 500 }
    )
  }
}
