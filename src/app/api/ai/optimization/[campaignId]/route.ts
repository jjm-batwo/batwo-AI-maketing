import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import {
  getAIService,
  getQuotaService,
  getCampaignRepository,
  getKPIRepository,
} from '@/lib/di/container'
import type { GenerateOptimizationInput } from '@application/ports/IAIService'

/**
 * GET /api/ai/optimization/[campaignId]
 * 캠페인 최적화 제안 조회
 */
export async function GET(
  _request: NextRequest,
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
        { message: 'AI 분석 쿼터가 초과되었습니다. 다음 주에 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // Get latest KPI data for the campaign
    const kpiRepo = getKPIRepository()
    const latestKPI = await kpiRepo.findLatestByCampaignId(campaignId)

    if (!latestKPI) {
      return NextResponse.json(
        { message: '캠페인의 KPI 데이터가 없습니다. 먼저 KPI 동기화를 진행해주세요.' },
        { status: 400 }
      )
    }

    // Build optimization input from campaign and KPI data
    const input: GenerateOptimizationInput = {
      campaignName: campaign.name,
      objective: campaign.objective,
      currentMetrics: {
        roas: latestKPI.calculateROAS(),
        cpa: latestKPI.calculateCPA().amount,
        ctr: latestKPI.calculateCTR().value,
        impressions: latestKPI.impressions,
        clicks: latestKPI.clicks,
        conversions: latestKPI.conversions,
        spend: latestKPI.spend.amount,
      },
      targetAudience: campaign.targetAudience
        ? {
            ageRange: campaign.targetAudience.ageMin && campaign.targetAudience.ageMax
              ? `${campaign.targetAudience.ageMin}-${campaign.targetAudience.ageMax}세`
              : undefined,
            interests: campaign.targetAudience.interests,
            locations: campaign.targetAudience.locations,
          }
        : undefined,
    }

    // Generate optimization suggestions
    const aiService = getAIService()
    const suggestions = await aiService.generateCampaignOptimization(input)

    // Log usage only on success
    await quotaService.logUsage(user.id, 'AI_ANALYSIS')

    // Get remaining quota
    const quotaStatus = await quotaService.getRemainingQuota(user.id)

    return NextResponse.json({
      campaignId,
      campaignName: campaign.name,
      suggestions,
      metrics: input.currentMetrics,
      remainingQuota: quotaStatus.AI_ANALYSIS?.remaining ?? 0,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to generate optimization suggestions:', error)
    return NextResponse.json(
      { message: 'AI 최적화 제안 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
