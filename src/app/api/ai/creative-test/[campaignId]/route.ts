import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import {
  getAIService,
  getQuotaService,
  getCampaignRepository,
  getKPIRepository,
} from '@/lib/di/container'
import { CreativeTestRecommendationService } from '@application/services/CreativeTestRecommendationService'

/**
 * GET /api/ai/creative-test/[campaignId]
 * 캠페인에 대한 A/B 테스트 설계 추천 조회
 *
 * 캠페인의 현재 성과를 분석하여:
 * 1. 가장 약한 크리에이티브 요소 식별
 * 2. AI 기반 변형 생성
 * 3. 통계적으로 유의미한 테스트 설계 제공
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { campaignId } = await params

    // Verify campaign ownership
    const campaignRepo = getCampaignRepository()
    const campaign = await campaignRepo.findById(campaignId)

    if (!campaign) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Check quota
    const quotaService = getQuotaService()
    const hasQuota = await quotaService.checkQuota(user.id, 'AI_ANALYSIS')
    if (!hasQuota) {
      return NextResponse.json(
        {
          message: 'AI 분석 쿼터가 초과되었습니다. 다음 주에 다시 시도해주세요.',
        },
        { status: 429 }
      )
    }

    // Create service instance
    const aiService = getAIService()
    const kpiRepo = getKPIRepository()
    const testRecommendationService = new CreativeTestRecommendationService(
      aiService,
      campaignRepo,
      kpiRepo
    )

    // Generate test recommendation
    const recommendation =
      await testRecommendationService.designTest(campaignId)

    // Log usage only on success
    await quotaService.logUsage(user.id, 'AI_ANALYSIS')

    // Get remaining quota
    const quotaStatus = await quotaService.getRemainingQuota(user.id)
    const remainingQuota = quotaStatus.AI_ANALYSIS?.remaining ?? 0

    return NextResponse.json({
      campaignId,
      campaignName: campaign.name,
      recommendation,
      remainingQuota,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to generate creative test recommendation:', error)

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === 'Campaign not found') {
        return NextResponse.json(
          { message: '캠페인을 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      if (error.message === 'No KPI data available for campaign') {
        return NextResponse.json(
          {
            message:
              '캠페인의 KPI 데이터가 없습니다. 먼저 KPI 동기화를 진행해주세요.',
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { message: 'A/B 테스트 설계 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
